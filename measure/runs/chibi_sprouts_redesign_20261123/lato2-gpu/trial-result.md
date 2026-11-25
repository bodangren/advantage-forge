# LATO.2 GPU trial result

Track: `chibi_sprouts_redesign_20261123`. Date: 23 November 2026, UTC.
Authority: Daniel approved USD 5 for one Spot L4 trial. The PM removed the on-demand fallback before the run.
Cap: USD 5 and 3 hours of VM time. Spend: about USD 0.58 and 1.04 VM hours.

## Steps and times

| Step | Start UTC | End UTC | Result |
|---|---|---|---|
| Local crop of the Kim front view | 01:58 | 01:59 | `kim-front.png`, 768 × 768, plain white background |
| Price basis from the Google Cloud pages | 01:58 | 01:59 | g2-standard-4 Spot in asia-southeast1 USD 0.544556 per hour; pd-balanced USD 0.11 per GiB-month |
| Create the Spot VM | 02:00:19 | 02:00:35 | `lato2-trial-0123`, asia-southeast1-a, g2-standard-4, 1 L4, 100 GiB pd-balanced boot disk |
| Clone LATO.2, venv, torch, base packages | 02:02 | 02:09 | torch 2.6.0+cu124; CUDA toolkit 12.9 present; image family `common-cu129-ubuntu-2204-nvidia-580` |
| Fix the build tools | 02:10 | 02:14 | `g++` and `python3.10-dev` were missing; install them with apt |
| Build the CUDA extensions | 02:15 | 02:30 | nvdiffrast 0.4.0, CuMesh 0.0.1, FlexGEMM 1.0.0; flash-attn 2.7.4.post1 wheel |
| Download the weights | 02:15 | 02:16 | 7 `.pt` files, 3.4 GiB; licence MIT |
| First two run attempts | 02:48 | 02:53 | Missing `safetensors`, then missing `kornia`; install both |
| One image-to-mesh run | 02:54:27 | 02:54:55 | Generation 28.21 s; total 65 s with model load; peak VRAM 8102 MB |
| Copy the mesh out | 02:55 | 02:56 | 516 KiB of outputs |
| Delete the VM and its disk | 03:01:56 | 03:02:00 | `Deleted .../instances/lato2-trial-0123` |
| Verify | 03:03 | 03:03 | `instances list`: "Listed 0 items." `disks list`: "Listed 0 items." |

VM time: 02:00:19 to 03:02:00 = 1.036 hours.

## Bill

| Item | Rate | Quantity | Cost |
|---|---|---|---|
| g2-standard-4 Spot, asia-southeast1 | USD 0.544556 per hour | 1.036 h | USD 0.564 |
| pd-balanced boot disk | USD 0.11 per GiB-month | 100 GiB for 1.036 h | USD 0.016 |
| Egress | first 200 GiB free | less than 1 MiB out | USD 0.00 |
| **Total** | | | **USD 0.58** |

The spend is 11.6 percent of the USD 5 cap. Spot preemption did not occur. No on-demand VM was created: the Cloud line carries `PREEMPTIBLE=true`.

## Weights licence

The Hugging Face model card `0x4c48/LATO.2` declares `license: mit`. The model repository holds no `LICENSE` file. The GitHub repository `LoHhhha/LATO.2` ships the MIT licence text. MIT permits this use. The weights came from Hugging Face into our own VM. Nothing went to the public demo, a hosted API or a third party.

Download size: 7 files and 3.4 GiB. The run also fetched the TRELLIS sparse-structure, DINOv2 and BiRefNet weights, so `ckpt/` measured 6.1 GB at the end.

## Mesh counts

| Measure | Value |
|---|---|
| File | `out/chibi-sprouts/redesign/lato2-gpu/kim-front_pred.obj` |
| Vertices | 2313 |
| Triangles | 4437 |
| Model height | 0.9959 units |
| Bounding box X, Y, Z | 0.2757, 0.9959, 0.3539 |
| Boundary edges | 287 |
| Non-manifold edges | 46 |
| Watertight | false |
| Connected components | 3 (2208, 56 and 49 vertices) |
| Euler number | −25 |
| Vertices with valence 6 | 61.2 percent |
| Bilateral symmetry, mean mirror distance | 0.00535 units (0.54 percent of height) |

The mesh has no UV set, no texture, no skin weights and no vertex colors. The emitter writes triangles only.

The local measurement venv is `/tmp/lato2venv`. The machine has no `ensurepip`, so `uv` built the venv with Python 3.11. It holds trimesh, numpy, matplotlib and Pillow. No package went to the system Python.

## Pass table, body rows

The front mask is 1201 px tall. Landmark rows from the crown: chin 318, shoulder 405, wrist 700, fingertip 833, hip 745, knee 950, sole 1203. The hip is the crotch row. The knee is not visible on the blockout, so the row follows Kim's hip-to-knee share of the hip-to-sole distance (0.447).

| Measure | Kim target | LATO.2 mesh | Delta | Pass |
|---|---|---|---|---|
| Height in heads | 3.64 ± 0.10 | 3.78 | +0.14 | no |
| Arm ÷ torso | 1.33 ± 0.08 | 1.27 | −0.06 | yes |
| Leg share | 0.39 ± 0.03 | 0.38 | −0.01 | yes |
| Head ÷ shoulders | 1.19 ± 0.08 | 1.27 | +0.08 | at the limit |
| Wrist over hip-to-knee | −0.06 ± 0.10 | −0.22 | −0.16 | no |
| Fingertips over hip-to-knee | 0.51 ± 0.10 | 0.43 | −0.08 | yes |

Two notes on the head over shoulder row. The shoulder joint centres are not separable on the blockout, so the row scales the silhouette width at the shoulder line by Kim's own factor (recorded span 209 px over her silhouette 232 px). The raw silhouette ratio gives 1.14. The sleeve flare hides the shoulder joint and makes both values uncertain.

The height in heads row depends on the chin row. The jaw meets the neck at row 318. A chin at row 340 would give 3.53. The blockout has no jaw line.

The face rows are not measurable. The mesh carries no texture, no UV set and no eyes. Eye line, eye height, pupil spacing and eye width have no source data on this mesh.

## Rig readiness

- Manifold: no. 287 boundary edges, 46 non-manifold edges and 3 components break a clean skin bind.
- Symmetry: yes, in shape. The mean mirror distance is 0.54 percent of height.
- Loops: no. The T-Flow stage writes an irregular triangulation. Only 61 percent of vertices have valence 6, and no edge ring or loop surrounds a joint.
- Hands and fingers: no. Each hand is a mitten with one thumb-like bump. The fingers do not separate, and the sleeves cover the wrist.
- Scale and facing: usable. The mesh is 1 unit tall, Y up, and it faces +X. The Forge base faces +Z, so a rotation is needed.

## Verdict

LATO.2 returns a usable massing blockout from one front view on one L4 in 28 seconds with 8.1 GB peak VRAM, for about USD 0.58 of VM time.
It passes three of six body and reach rows, sits at the limit on the fourth, and fails the height in heads and wrist rows.
It gives no face, no fingers, no edge loops and no watertight surface, so it is not a rig-ready base.
Use it as a silhouette reference for the new Forge SDF base, and do not run it again until the SDF base has a reviewed front and side view.

## Leftover state

`gcloud compute instances list` and `gcloud compute disks list` returned "Listed 0 items." after the delete. Nothing named `lato2-trial-0123` remains, and no other instance or disk was created. The trial created no firewall rule and no network.

One artifact stays. `gcloud compute ssh` added a public key for user `daniebo` to the project common instance metadata (`ssh-keys`). Remove it with the console metadata editor or the command below if the owner wants the project metadata as it was.

```bash
gcloud compute project-info describe --project=reading-advantage --format=json \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['commonInstanceMetadata'])"
```

## Artifacts

| Path | Content |
|---|---|
| `out/chibi-sprouts/redesign/lato2-gpu/kim-front.png` | Kim front crop, the only input |
| `out/chibi-sprouts/redesign/lato2-gpu/kim-front_pred.obj` | The mesh, 2313 vertices and 4437 triangles |
| `out/chibi-sprouts/redesign/lato2-gpu/kim-front_pred.ply` | Vertices only |
| `out/chibi-sprouts/redesign/lato2-gpu/kim-front_cond.png` | The conditioning crop that DINOv2 saw |
| `out/chibi-sprouts/redesign/lato2-gpu/kim-front_ss.ply` | The 64³ sparse scaffold |
| `out/chibi-sprouts/redesign/lato2-gpu/mesh-front.png` | Front orthographic silhouette, 1200 px crown to sole |
| `out/chibi-sprouts/redesign/lato2-gpu/mesh-side.png` | Side orthographic silhouette, same scale |
| `out/chibi-sprouts/redesign/lato2-gpu/lato2-review.png` | Kim crop, mesh front and mesh side at one height |
| `out/chibi-sprouts/redesign/lato2-gpu/mesh-metrics.json` | Counts, symmetry and ratios |
| `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv` | One row per step, with times and the running bill |
| `out/chibi-sprouts/redesign/lato2-gpu/vm-setup.sh` | The first VM setup script, kept for a repeat run |
| `out/chibi-sprouts/redesign/lato2-gpu/vm-setup2.sh` | The extension build script, kept for a repeat run |
