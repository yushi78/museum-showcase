import bpy
m = bpy.data.materials.new('t')
m.use_nodes = True
for n in m.node_tree.nodes:
    if n.type == 'BSDF_PRINCIPLED':
        print("PRINCIPLED INPUTS:")
        for s in n.inputs:
            print("  ", repr(s.identifier), "=>", s.name)
        print("PRINCIPLED OUTPUTS:")
        for s in n.outputs:
            print("  ", repr(s.identifier), "=>", s.name)
# modifier name default
bpy.ops.mesh.primitive_cube_add()
o = bpy.context.object
bpy.ops.object.modifier_add(type='BEVEL')
print("BEVEL MOD NAME:", o.modifiers[-1].name)
# normal map node
nm = m.node_tree.nodes.new('ShaderNodeNormalMap')
print("NORMALMAP INPUTS:")
for s in nm.inputs:
    print("  ", repr(s.identifier), "=>", s.name)
