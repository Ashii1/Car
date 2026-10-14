import struct
import json
import math
import array
import time

t0 = time.time()
print("Starting production motorcycle GLB generation...")

with open('public/models/motorcycle.glb', 'rb') as f:
    data = f.read()

json_len, _ = struct.unpack('<II', data[12:20])
gltf = json.loads(data[20:20+json_len])
bin_data = data[20+json_len+8:]

idx_acc = gltf['accessors'][0]
pos_acc = gltf['accessors'][1]

idx_bv = gltf['bufferViews'][idx_acc['bufferView']]
pos_bv = gltf['bufferViews'][pos_acc['bufferView']]

num_verts = pos_acc['count']
num_indices = idx_acc['count']

print(f"Loaded source mesh: {num_verts} vertices, {num_indices//3} triangles")

# Read positions as float array
pos_raw = array.array('f')
pos_raw.frombytes(bin_data[pos_bv['byteOffset']:pos_bv['byteOffset'] + num_verts * 12])

# Read indices as unsigned int array
idx_raw = array.array('I')
idx_raw.frombytes(bin_data[idx_bv['byteOffset']:idx_bv['byteOffset'] + num_indices * 4])

# Compute smooth vertex normals
print("Computing smooth vertex normals...")
nx = [0.0] * num_verts
ny = [0.0] * num_verts
nz = [0.0] * num_verts

for i in range(0, num_indices, 3):
    i0 = idx_raw[i]
    i1 = idx_raw[i+1]
    i2 = idx_raw[i+2]

    p0x, p0y, p0z = pos_raw[i0*3], pos_raw[i0*3+1], pos_raw[i0*3+2]
    p1x, p1y, p1z = pos_raw[i1*3], pos_raw[i1*3+1], pos_raw[i1*3+2]
    p2x, p2y, p2z = pos_raw[i2*3], pos_raw[i2*3+1], pos_raw[i2*3+2]

    # Edge vectors
    e1x, e1y, e1z = p1x - p0x, p1y - p0y, p1z - p0z
    e2x, e2y, e2z = p2x - p0x, p2y - p0y, p2z - p0z

    # Cross product
    cx = e1y * e2z - e1z * e2y
    cy = e1z * e2x - e1x * e2z
    cz = e1x * e2y - e1y * e2x

    nx[i0] += cx
    ny[i0] += cy
    nz[i0] += cz
    nx[i1] += cx
    ny[i1] += cy
    nz[i1] += cz
    nx[i2] += cx
    ny[i2] += cy
    nz[i2] += cz

for i in range(num_verts):
    l = math.sqrt(nx[i]*nx[i] + ny[i]*ny[i] + nz[i]*nz[i])
    if l > 1e-7:
        inv = 1.0 / l
        nx[i] *= inv
        ny[i] *= inv
        nz[i] *= inv
    else:
        ny[i] = 1.0

print(f"Normals computed in {time.time()-t0:.2f}s")

# Real-world sportbike scaling & road contact
SCALE = 1.88
OFFSET_Y = 0.593

FRONT_AXLE = (0.0, 0.318, 0.7275)
REAR_AXLE = (0.0, 0.318, -0.7267)
HEADSTOCK = (0.0, 0.950, 0.380)

GROUP_NAMES = [
    'Wheel_Front_Tire',
    'Wheel_Front_Rim',
    'Wheel_Rear_Tire',
    'Wheel_Rear_Rim',
    'Wheel_Front',
    'Wheel_Rear',
    'Forks_Controls',
    'Windscreen_Glass',
    'Headlight_Lens',
    'Taillight_LED',
    'Seat_Saddle',
    'Bodywork_Paint',
    'Engine_Exhaust',
    'Chassis_Frame',
]

group_tris = {k: [] for k in GROUP_NAMES}

for i in range(0, num_indices, 3):
    i0, i1, i2 = idx_raw[i], idx_raw[i+1], idx_raw[i+2]

    cx = ((pos_raw[i0*3] + pos_raw[i1*3] + pos_raw[i2*3]) / 3.0) * SCALE
    cy = ((pos_raw[i0*3+1] + pos_raw[i1*3+1] + pos_raw[i2*3+1]) / 3.0) * SCALE + OFFSET_Y
    cz = ((pos_raw[i0*3+2] + pos_raw[i1*3+2] + pos_raw[i2*3+2]) / 3.0) * SCALE

    dist_f = math.hypot(cz - FRONT_AXLE[2], cy - FRONT_AXLE[1])
    dist_r = math.hypot(cz - REAR_AXLE[2], cy - REAR_AXLE[1])

    # Only the actual rotating wheel (tire, rim, and brake discs)
    is_front_wheel = (dist_f <= 0.320 and abs(cx) <= 0.095) or (dist_f <= 0.185 and abs(cx) <= 0.125)
    is_rear_wheel = (dist_r <= 0.335 and abs(cx) <= 0.22 and cy < 0.62)

    if is_front_wheel:
        cat = 'Wheel_Front_Tire' if dist_f > 0.21 else 'Wheel_Front_Rim'
        group_tris['Wheel_Front'].extend([i0, i1, i2])
    elif is_rear_wheel:
        cat = 'Wheel_Rear_Tire' if dist_r > 0.22 else 'Wheel_Rear_Rim'
        group_tris['Wheel_Rear'].extend([i0, i1, i2])
    elif cz > 0.30 and cz < 0.62 and cy > 0.94 and abs(cx) < 0.22 and cy > cz * 0.45 + 0.75:
        cat = 'Windscreen_Glass'
    elif cz > 0.72 and cy > 0.72 and cy < 0.96 and abs(cx) < 0.16:
        cat = 'Headlight_Lens'
    elif cz < -0.84 and cy > 0.88 and cy < 1.02 and abs(cx) < 0.13:
        cat = 'Taillight_LED'
    elif cz > -0.44 and cz < -0.10 and cy > 0.78 and cy < 0.92 and abs(cx) < 0.18:
        cat = 'Seat_Saddle'
    elif (cy > 0.96 and abs(cx) > 0.18) or (cz > 0.45 and cy > 0.30 and cy < 0.95 and abs(cx) > 0.08 and abs(cx) < 0.22):
        cat = 'Forks_Controls'
    elif cy < 0.65 and cz > -0.45 and cz < 0.38:
        cat = 'Engine_Exhaust'
    elif cy > 0.70 or (cz < -0.40 and cy > 0.65):
        cat = 'Bodywork_Paint'
    else:
        cat = 'Chassis_Frame'

    group_tris[cat].extend([i0, i1, i2])

print("Triangles per group:")
for name in GROUP_NAMES:
    print(f"  {name:20s}: {len(group_tris[name])//3} triangles")

# Build GLTF binary data
bin_chunks = bytearray()
buffer_views = []
accessors = []
meshes = []
nodes = []

for name in GROUP_NAMES:
    tris = group_tris[name]
    if len(tris) == 0:
        continue

    # Determine coordinate pivot offset
    if name in ('Wheel_Front', 'Wheel_Front_Tire', 'Wheel_Front_Rim'):
        ox, oy, oz = FRONT_AXLE
    elif name in ('Wheel_Rear', 'Wheel_Rear_Tire', 'Wheel_Rear_Rim'):
        ox, oy, oz = REAR_AXLE
    elif name in ('Forks_Controls', 'Windscreen_Glass'):
        ox, oy, oz = HEADSTOCK
    else:
        ox, oy, oz = 0.0, 0.0, 0.0

    # Build unique vertex mapping for this submesh
    vert_map = {}
    sub_pos = []
    sub_norm = []
    sub_idx = []

    for orig_i in tris:
        if orig_i not in vert_map:
            new_idx = len(sub_pos) // 3
            vert_map[orig_i] = new_idx

            vx = pos_raw[orig_i*3] * SCALE - ox
            vy = pos_raw[orig_i*3+1] * SCALE + OFFSET_Y - oy
            vz = pos_raw[orig_i*3+2] * SCALE - oz
            sub_pos.extend([vx, vy, vz])

            sub_norm.extend([nx[orig_i], ny[orig_i], nz[orig_i]])

        sub_idx.append(vert_map[orig_i])

    pos_bytes = struct.pack(f'<{len(sub_pos)}f', *sub_pos)
    norm_bytes = struct.pack(f'<{len(sub_norm)}f', *sub_norm)
    idx_bytes = struct.pack(f'<{len(sub_idx)}I', *sub_idx)

    # Align to 4-byte boundaries
    while len(bin_chunks) % 4 != 0:
        bin_chunks.append(0)

    # 1. Position BufferView & Accessor
    pos_offset = len(bin_chunks)
    bin_chunks.extend(pos_bytes)
    pos_bv_idx = len(buffer_views)
    buffer_views.append({
        'buffer': 0,
        'byteOffset': pos_offset,
        'byteLength': len(pos_bytes),
        'target': 34962 # ARRAY_BUFFER
    })

    sub_vert_count = len(sub_pos) // 3
    min_x = min(sub_pos[0::3]); max_x = max(sub_pos[0::3])
    min_y = min(sub_pos[1::3]); max_y = max(sub_pos[1::3])
    min_z = min(sub_pos[2::3]); max_z = max(sub_pos[2::3])

    pos_acc_idx = len(accessors)
    accessors.append({
        'bufferView': pos_bv_idx,
        'byteOffset': 0,
        'componentType': 5126, # FLOAT
        'count': sub_vert_count,
        'type': 'VEC3',
        'min': [min_x, min_y, min_z],
        'max': [max_x, max_y, max_z]
    })

    # 2. Normal BufferView & Accessor
    while len(bin_chunks) % 4 != 0:
        bin_chunks.append(0)
    norm_offset = len(bin_chunks)
    bin_chunks.extend(norm_bytes)
    norm_bv_idx = len(buffer_views)
    buffer_views.append({
        'buffer': 0,
        'byteOffset': norm_offset,
        'byteLength': len(norm_bytes),
        'target': 34962
    })
    norm_acc_idx = len(accessors)
    accessors.append({
        'bufferView': norm_bv_idx,
        'byteOffset': 0,
        'componentType': 5126,
        'count': sub_vert_count,
        'type': 'VEC3',
        'min': [-1.0, -1.0, -1.0],
        'max': [1.0, 1.0, 1.0]
    })

    # 3. Index BufferView & Accessor
    while len(bin_chunks) % 4 != 0:
        bin_chunks.append(0)
    idx_offset = len(bin_chunks)
    bin_chunks.extend(idx_bytes)
    idx_bv_idx = len(buffer_views)
    buffer_views.append({
        'buffer': 0,
        'byteOffset': idx_offset,
        'byteLength': len(idx_bytes),
        'target': 34963 # ELEMENT_ARRAY_BUFFER
    })
    idx_acc_idx = len(accessors)
    accessors.append({
        'bufferView': idx_bv_idx,
        'byteOffset': 0,
        'componentType': 5125, # UNSIGNED_INT
        'count': len(sub_idx),
        'type': 'SCALAR',
        'min': [0],
        'max': [sub_vert_count - 1]
    })

    # Mesh & Node
    mesh_idx = len(meshes)
    meshes.append({
        'name': name,
        'primitives': [{
            'attributes': {
                'POSITION': pos_acc_idx,
                'NORMAL': norm_acc_idx,
            },
            'indices': idx_acc_idx,
            'mode': 4 # TRIANGLES
        }]
    })

    node = {
        'name': name,
        'mesh': mesh_idx,
    }
    if ox != 0.0 or oy != 0.0 or oz != 0.0:
        node['translation'] = [ox, oy, oz]

    nodes.append(node)

# Build GLTF JSON header
gltf_out = {
    'asset': {
        'generator': 'ProductionMotorcycleExporter',
        'version': '2.0'
    },
    'scene': 0,
    'scenes': [{
        'name': 'MotorcycleScene',
        'nodes': list(range(len(nodes)))
    }],
    'nodes': nodes,
    'meshes': meshes,
    'accessors': accessors,
    'bufferViews': buffer_views,
    'buffers': [{
        'byteLength': len(bin_chunks)
    }]
}

json_bytes = json.dumps(gltf_out, separators=(',', ':')).encode('utf-8')
while len(json_bytes) % 4 != 0:
    json_bytes += b' '

while len(bin_chunks) % 4 != 0:
    bin_chunks.append(0)

total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_chunks)

glb_out = bytearray()
# Header
glb_out.extend(struct.pack('<4sII', b'glTF', 2, total_length))
# JSON chunk
glb_out.extend(struct.pack('<II', len(json_bytes), 0x4E4F534A))
glb_out.extend(json_bytes)
# BIN chunk
glb_out.extend(struct.pack('<II', len(bin_chunks), 0x004E4942))
glb_out.extend(bin_chunks)

with open('public/models/production_motorcycle.glb', 'wb') as f:
    f.write(glb_out)

print(f"SUCCESS! Created public/models/production_motorcycle.glb in {time.time()-t0:.2f}s, size: {len(glb_out):,} bytes")
