# Infra Submodule Workflow

## Regla clave
Cuando cambias infraestructura en `infra/shared-terraform`, **siempre** debes hacer un `bump` en cada repo padre para actualizar el SHA del submódulo.

## Flujo estándar
1. Entrar al submódulo:
   - `cd infra/shared-terraform`
2. Hacer cambios, commit y push en `victorycraft-infra`:
   - `git add .`
   - `git commit -m "infra: <cambio>"`
   - `git push origin main`
3. Volver al repo padre y actualizar puntero (bump):
   - `cd ../..`
   - `git add infra/shared-terraform`
   - `git commit -m "chore(infra): bump shared-terraform to <sha>"`
   - `git push`

## Verificación rápida
- Ver SHA consumido por el repo padre:
  - `git submodule status --recursive`
- Ver estado del submódulo:
  - `git -C infra/shared-terraform status`

## Clonado correcto
- `git clone --recurse-submodules <repo-padre>`
- Si ya está clonado: `git submodule update --init --recursive`
