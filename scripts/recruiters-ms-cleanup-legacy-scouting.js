#!/usr/bin/env node

require("dotenv").config();
const mongoose = require("mongoose");

const requiredPublishedFields = [
  "playerProfileId",
  "title",
  "sportType",
  "playType",
  "tournamentType",
  "tournamentName",
  "recordedAt",
];

const missingFieldExpressions = requiredPublishedFields.map((field) => ({
  $cond: [
    {
      $or: [
        { $eq: [`$${field}`, null] },
        { $eq: [{ $type: `$${field}` }, "missing"] },
        ...(field === "recordedAt" ? [] : [{ $eq: [`$${field}`, ""] }]),
      ],
    },
    [field],
    [],
  ],
}));

const toKey = (value) => String(value);

async function findInvalidScoutingProfiles(db) {
  const scouting = db.collection("video_scouting_profiles");

  const rows = await scouting
    .aggregate([
      {
        $lookup: {
          from: "player_profiles",
          localField: "playerProfileId",
          foreignField: "_id",
          as: "profile",
        },
      },
      {
        $lookup: {
          from: "player_profile_video_links",
          let: { videoId: "$videoId", playerProfileId: "$playerProfileId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$videoId", "$$videoId"] }, { $eq: ["$playerProfileId", "$$playerProfileId"] }],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "link",
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videoId",
          foreignField: "_id",
          as: "video",
        },
      },
      {
        $project: {
          _id: 1,
          videoId: 1,
          playerProfileId: 1,
          title: 1,
          publicationStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          missingFields: { $concatArrays: missingFieldExpressions },
          hasProfile: { $gt: [{ $size: "$profile" }, 0] },
          hasLink: { $gt: [{ $size: "$link" }, 0] },
          hasVideo: { $gt: [{ $size: "$video" }, 0] },
        },
      },
    ])
    .toArray();

  return rows
    .map((row) => {
      const reasons = [];
      if (!row.hasVideo) reasons.push("video_not_found");
      if (!row.playerProfileId) reasons.push("missing_player_profile_id");
      if (row.playerProfileId && !row.hasProfile) reasons.push("player_profile_not_found");
      if (row.playerProfileId && !row.hasLink) reasons.push("player_profile_video_not_linked");
      if ((!row.publicationStatus || row.publicationStatus === "published") && row.missingFields.length > 0) {
        reasons.push(`missing_published_fields:${row.missingFields.join(",")}`);
      }

      if (reasons.length === 0) return null;

      return {
        _id: row._id,
        videoId: row.videoId,
        playerProfileId: row.playerProfileId || null,
        title: row.title || null,
        publicationStatus: row.publicationStatus || "published",
        createdAt: row.createdAt || null,
        updatedAt: row.updatedAt || null,
        reasons,
      };
    })
    .filter(Boolean);
}

async function findOrphanVideoLinks(db) {
  return db
    .collection("player_profile_video_links")
    .aggregate([
      {
        $lookup: {
          from: "player_profiles",
          localField: "playerProfileId",
          foreignField: "_id",
          as: "profile",
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videoId",
          foreignField: "_id",
          as: "video",
        },
      },
      {
        $project: {
          _id: 1,
          playerProfileId: 1,
          videoId: 1,
          linkedBy: 1,
          createdAt: 1,
          missingProfile: { $eq: ["$profile", []] },
          missingVideo: { $eq: ["$video", []] },
        },
      },
      { $match: { $or: [{ missingProfile: true }, { missingVideo: true }] } },
    ])
    .toArray();
}

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  try {
    const invalidScoutingProfiles = await findInvalidScoutingProfiles(db);
    const orphanVideoLinks = await findOrphanVideoLinks(db);

    const result = {
      database: db.databaseName,
      mode: apply ? "apply" : "dry-run",
      invalidScoutingProfilesCount: invalidScoutingProfiles.length,
      orphanVideoLinksCount: orphanVideoLinks.length,
      invalidScoutingProfiles,
      orphanVideoLinks,
    };

    if (apply) {
      if (invalidScoutingProfiles.length > 0) {
        await db
          .collection("video_scouting_profiles")
          .deleteMany({ _id: { $in: invalidScoutingProfiles.map((item) => item._id) } });
      }

      if (orphanVideoLinks.length > 0) {
        await db
          .collection("player_profile_video_links")
          .deleteMany({ _id: { $in: orphanVideoLinks.map((item) => item._id) } });
      }

      result.deletedScoutingProfileIds = invalidScoutingProfiles.map((item) => toKey(item._id));
      result.deletedPlayerProfileVideoLinkIds = orphanVideoLinks.map((item) => toKey(item._id));
    }

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
  process.exit(1);
});
