#!/usr/bin/env python3
"""Modern gallery models rebuilt as silhouette-led continuous meshes.

Run with Blender in background mode.  Basic primitives are deliberately kept
to secondary mechanical details; every exhibit's dominant form is a loft,
lathed shell, curve network, or a continuous extruded skin.
"""
import bpy, math, os, sys
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from lib import purge, mat_pbr, loft_sections, bezier_tube, tube, rounded_box, export_glb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'site', 'models')

def mat(name, color, metal=0.0, rough=.45, alpha=1.0, transmission=0.0):
    return mat_pbr(name, metalness=metal, roughness=rough, base_color=(*color, 1),
                   alpha=alpha, transmission=transmission)

def assign(obj, material):
    obj.data.materials.append(material); return obj

def uv_ring(cx, y, rx, rz, n=16, squash=1.0):
    return [(cx, y + math.sin(i*2*math.pi/n)*rx*squash,
             math.cos(i*2*math.pi/n)*rz) for i in range(n)]

def wheel(x, y, z, radius, width, tire, rim):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius*.73, minor_radius=radius*.27,
        major_segments=40, minor_segments=12, location=(x,y,z))
    assign(bpy.context.object, tire)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius*.58, depth=width,
        location=(x,y,z))
    assign(bpy.context.object, rim)

def concept_car():
    silver=mat('pearl silver',(.68,.73,.77),.72,.18); glass=mat('smoked canopy',(.025,.055,.075),.35,.08)
    black=mat('carbon',(.015,.018,.022),.35,.27); cyan=mat('light',(.08,.65,1),.2,.12)
    copper=mat('rose gold wheel detail',(.62,.27,.12),.82,.2)
    # VISION EQXX one-bow shell; 13 matched transverse stations, not stacked boxes.
    stations=[(-2.49,.44,.54,.54),(-2.25,.54,.72,.66),(-1.85,.82,.86,.72),(-1.35,1.12,.92,.76),
      (-.8,1.31,.95,.80),(-.2,1.35,.95,.82),(.45,1.27,.94,.80),(1.05,1.06,.92,.75),(1.55,.79,.89,.68),
      (1.98,.62,.82,.58),(2.3,.52,.69,.46),(2.48,.43,.5,.38)]
    sections=[]
    for x,h,w,shoulder in stations:
        belt=min(.63,h*.72)
        sections.append([(x,.16,-w*.72),(x,.2,-w),(x,.43,-w),(x,belt,-w*shoulder),
                         (x,belt+.04,0),(x,belt,w*shoulder),(x,.43,w),(x,.2,w),(x,.16,w*.72),(x,.1,0)])
    body=assign(loft_sections(sections,'EQXX continuous body'),silver)
    sub=body.modifiers.new('automotive subdivision','SUBSURF'); sub.subdivision_type='CATMULL_CLARK'; sub.levels=2; sub.render_levels=2
    canopy=[]
    for x,h,w,_ in stations[3:9]:
        canopy.append([(x,.56,-w*.69),(x,h-.03,-w*.43),(x,h+.015,0),(x,h-.03,w*.43),(x,.56,w*.69),(x,.53,0)])
    canopy_obj=assign(loft_sections(canopy,'single bow glass canopy'),glass)
    sub=canopy_obj.modifiers.new('canopy subdivision','SUBSURF'); sub.subdivision_type='CATMULL_CLARK'; sub.levels=2; sub.render_levels=2
    for x in (-1.48,1.48):
        for z in (-.86,.86): wheel(x,.25,z,.37,.13,black,silver)
        for side in (-1,1):
            z=side*(.86+.071)
            bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=.265,depth=.012,location=(x,.25,z))
            cover=bpy.context.object; cover.name='aerodynamic magnesium wheel cover'; cover.data.materials.append(silver)
            bpy.ops.mesh.primitive_torus_add(major_radius=.19,minor_radius=.012,major_segments=36,minor_segments=8,
                location=(x,.25,z+side*.008))
            ring=bpy.context.object; ring.name='rose gold wheel ring'; ring.data.materials.append(copper)
        # Sculpted wheel-arch lips visually connect tire and body.
        for z in (-.925,.925):
            bpy.ops.mesh.primitive_torus_add(major_radius=.405,minor_radius=.035,major_segments=40,minor_segments=8,
                location=(x,.3,z))
            arch=bpy.context.object; arch.name='integrated wheel arch'; arch.scale.z=.92; arch.data.materials.append(silver)
    # continuous front and tail lamps follow the tapered perimeter
    assign(bezier_tube([(2.43,.42,-.52),(2.51,.48,0),(2.43,.42,.52)],.018,name='front light'),cyan)
    assign(bezier_tube([(-2.43,.46,-.42),(-2.5,.5,0),(-2.43,.46,.42)],.017,name='tail light'),cyan)
    # Closed EV nose with a readable three-point star, recessed rather than a
    # conventional open combustion grille.
    grille=rounded_box(.025,.14,.36,.035,5,'closed EQXX nose panel'); grille.location=(2.475,.39,0); grille.data.materials.append(black)
    assign(bezier_tube([(2.5,.4,0),(2.5,.49,0)],.012,8,'Mercedes star vertical'),silver)
    assign(bezier_tube([(2.5,.4,0),(2.5,.35,-.085)],.012,8,'Mercedes star left'),silver)
    assign(bezier_tube([(2.5,.4,0),(2.5,.35,.085)],.012,8,'Mercedes star right'),silver)

    # Deep black headlamp chambers with the EQXX four-segment light signature.
    for zsign in (-1,1):
        z=zsign*.69
        chamber=loft_sections([
            [(2.18,.42,z-zsign*.17),(2.18,.51,z-zsign*.14),(2.18,.55,z+zsign*.12),(2.18,.43,z+zsign*.16)],
            [(2.42,.39,z-zsign*.13),(2.42,.47,z-zsign*.10),(2.42,.49,z+zsign*.09),(2.42,.40,z+zsign*.12)]
        ],'headlamp chamber')
        assign(chamber,black)
        for k in range(4):
            zz=z-zsign*.105+zsign*k*.07
            assign(bezier_tube([(2.405,.445,zz-zsign*.025),(2.455,.455,zz),(2.405,.445,zz+zsign*.025)],.009,8,'headlamp LED'),cyan)

    # Side glazing as distinct continuous surfaces. The old model had one
    # featureless canopy and therefore read as a generic capsule.
    window_mat=mat('EQXX side glazing',(.018,.035,.045),.25,.08) if False else glass
    for side in (-1,1):
        z=side*.79
        pts=[(-1.22,.62,z),(-1.0,1.02,z),(-.66,1.21,z),(-.15,1.25,z),(.32,1.16,z),(.78,.69,z)]
        mesh=bpy.data.meshes.new('side window mesh'); mesh.from_pydata(pts,[],[tuple(range(len(pts)))]); mesh.update()
        side_window=bpy.data.objects.new('side window',mesh); bpy.context.collection.objects.link(side_window)
        solid=side_window.modifiers.new('window thickness','SOLIDIFY'); solid.thickness=.012
        assign(side_window,glass)
        # A/B/C pillars and flush door separation lines.
        for x,y0,y1 in [(-.9,.61,1.08),(-.2,.58,1.24),(.46,.58,1.03)]:
            assign(bezier_tube([(x,y0,z+side*.019),(x,y1,z+side*.019)],.012,8,'window pillar'),black)
        for x in (-.83,.22):
            assign(bezier_tube([(x,.2,z+side*.025),(x,.54,z+side*.025)],.006,8,'door shut line'),black)
        # Flush handles and camera mirrors.
        assign(bezier_tube([(-.48,.49,z+side*.035),(-.32,.5,z+side*.035)],.012,8,'flush handle'),black)
        assign(bezier_tube([(.42,.5,z+side*.035),(.56,.5,z+side*.035)],.012,8,'flush handle'),black)
        assign(loft_sections([
          [( .76,.61,z),( .91,.63,z),( .9,.66,z),( .77,.66,z)],
          [( .76,.61,z+side*.13),( .91,.63,z+side*.12),( .9,.66,z+side*.10),( .77,.66,z+side*.11)]
        ],'camera mirror'),black)

    # 117 photovoltaic cells are represented by a readable 9x5 array on the
    # rear roof, following its slope rather than floating above it.
    solar=mat('solar cells',(.025,.09,.13),.38,.12) if False else black
    for row in range(5):
        for col in range(9):
            x=-1.34+col*.15; z=-.42+row*.21
            y=.91-.10*abs(x+.68)-.03*abs(z)
            panel=rounded_box(.13,.008,.18,.008,2,'solar cell')
            panel.location=(x,y,z); panel.data.materials.append(solar)

    # Rear glass, black diffuser and the characteristic drooping three-line
    # light blades at both corners.
    rear_glass=loft_sections([
      [(-1.72,.58,-.55),(-1.48,.78,-.46),(-1.17,.86,-.36),(-1.02,.88,0),(-1.17,.86,.36),(-1.48,.78,.46),(-1.72,.58,.55)],
      [(-1.75,.57,-.54),(-1.51,.76,-.45),(-1.2,.83,-.35),(-1.05,.85,0),(-1.2,.83,.35),(-1.51,.76,.45),(-1.75,.57,.54)]
    ],'rear solar glass',False); assign(rear_glass,glass)
    diffuser=loft_sections([
      [(-2.47,.17,-.66),(-2.47,.43,-.83),(-2.47,.55,-.66),(-2.47,.48,0),(-2.47,.55,.66),(-2.47,.43,.83),(-2.47,.17,.66)],
      [(-2.51,.16,-.62),(-2.51,.40,-.78),(-2.51,.51,-.62),(-2.51,.45,0),(-2.51,.51,.62),(-2.51,.40,.78),(-2.51,.16,.62)]
    ],'rear diffuser'); assign(diffuser,black)
    red=mat('tail lamp red',(1,.018,.008),.15,.12) if False else cyan
    for side in (-1,1):
        for k in range(3):
            off=k*.035
            assign(bezier_tube([(-2.505,.5-off,side*.62),(-2.525,.43-off,side*.77),(-2.515,.24-off,side*.83)],.011,8,'tail blade'),red)

def evtol():
    white=mat('composite white',(.82,.86,.88),.25,.24); glass=mat('canopy',(.018,.075,.105),.15,.08,.48,.35)
    carbon=mat('carbon arms',(.018,.022,.025),.45,.25); metal=mat('motors',(.24,.28,.3),.8,.2)
    # EH216-S teardrop two-seat pod, lofted along its length.
    sections=[]
    # Longitudinal stations follow the narrow, tall EH216-S passenger pod:
    # pointed nose, full-width shoulder behind the doors, then a short tail.
    for x,cy,ry,rz in [(-1.22,.72,.22,.28),(-1.03,.72,.52,.58),(-.58,.72,.72,.73),
                        (.05,.70,.78,.76),(.58,.68,.68,.69),(.98,.66,.45,.5),(1.16,.65,.2,.25)]:
        sections.append(uv_ring(x,cy,ry,rz,24,.92))
    assign(loft_sections(sections,'EH216 cabin'),white)
    canopy=[uv_ring(x,cy,ry,rz,24,.66) for x,cy,ry,rz in [(-1.13,.88,.25,.34),(-.88,.93,.52,.66),
                                                           (-.4,.98,.6,.76),(.12,.96,.56,.74),(.42,.9,.35,.62)]]
    assign(loft_sections(canopy,'EH216 panoramic canopy'),glass)
    # The real cabin reads as a glazed two-seat pod, not an opaque ball.  Add
    # the characteristic door glazing, centre mullions and lower keel break.
    frame=mat('window and door frames',(.045,.055,.06),.35,.22)
    for side in (-1,1):
        win=rounded_box(1.12,.55,.018,.1,8,'gullwing side door glass')
        win.location=(-.12,.98,side*.766); win.data.materials.append(glass)
        for x in (-.69,.46):
            assign(tube((x,.7,side*.778),(x,1.28,side*.778),.02,12,'door frame'),frame)
        assign(bezier_tube([(-.69,1.26,side*.778),(-.16,1.48,side*.79),(.46,1.24,side*.778)],.02,10,'door roof frame'),frame)
        handle=rounded_box(.13,.025,.018,.009,3,'flush door handle')
        handle.location=(.32,.89,side*.795); handle.data.materials.append(frame)
    # Forward windscreen and its central divider establish a definite nose.
    nose=rounded_box(.035,.58,.66,.11,8,'forward panoramic windscreen')
    nose.location=(-1.055,.96,0); nose.data.materials.append(glass)
    assign(tube((-1.08,.66,0),(-1.08,1.29,0),.02,12,'windscreen centre mullion'),frame)
    keel=assign(bezier_tube([(-1.08,.42,0),(-.3,.29,0),(.96,.45,0)],.04,12,'lower cabin keel'),frame)
    for i in range(8):
        a=i*math.pi/4; hub=(math.cos(a)*2.42,1.12,math.sin(a)*2.42)
        root=(math.cos(a)*(.82 if abs(math.cos(a))<.5 else 1.0),.82,math.sin(a)*.78)
        assign(tube(root,hub,.04,20,'radial carbon arm'),carbon)
        bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.11,depth=.22,location=hub)
        assign(bpy.context.object,metal)
        for dy in (-.09,.13):
            p=(hub[0],hub[1]+dy,hub[2])
            assign(bezier_tube([(p[0]-.47*math.sin(a),p[1],p[2]+.47*math.cos(a)),p,
                                (p[0]+.47*math.sin(a),p[1],p[2]-.47*math.cos(a))],.018,8,'coaxial propeller'),carbon)
    for z in (-.42,.42):
        assign(bezier_tube([(-.72,.12,z),(-.38,.04,z),(.65,.06,z),(.84,.14,z)],.035,10,'landing skid'),carbon)
        assign(tube((-.45,.08,z),(-.3,.58,z),.027),carbon); assign(tube((.56,.08,z),(.4,.58,z),.027),carbon)

def watch():
    titanium=mat('titanium',(.48,.5,.48),.85,.22); screen=mat('sapphire display',(.008,.018,.025),.15,.05)
    orange=mat('orange alpine loop',(.95,.19,.025),0,.55)
    black=mat('watch black detail',(.008,.01,.012),.2,.25)
    # Rounded-square watch case from superellipse sections.
    def superring(z,w,h,n=40,p=4):
        pts=[]
        for i in range(n):
            a=2*math.pi*i/n; c=math.cos(a); s=math.sin(a)
            pts.append((math.copysign(abs(c)**(2/p)*w,c),math.copysign(abs(s)**(2/p)*h,s),z))
        return pts
    assign(loft_sections([superring(-.075,.275,.31),superring(.075,.27,.305)],'Ultra titanium case'),titanium)
    # Raised titanium bezel protects the perfectly flat sapphire crystal.
    bezel=assign(loft_sections([superring(.074,.255,.29),superring(.092,.252,.287)],'raised titanium bezel'),titanium)
    assign(loft_sections([superring(.093,.238,.273),superring(.101,.235,.27)],'flat sapphire face'),screen)
    # Display content: concentric activity rings and four corner complications.
    blue=mat('display cyan',(.02,.55,1),.15,.12); red=mat('display orange',(1,.12,.015),.1,.16)
    for radius,color in [(.145,red),(.11,blue),(.075,orange)]:
        bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=.008,major_segments=32,minor_segments=6,
            location=(0,0,.106))
        ring=bpy.context.object; ring.name='activity ring'; ring.scale.y=1.08; ring.data.materials.append(color)
    for x,y in [(-.18,-.2),(.18,-.2),(-.18,.2),(.18,.2)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.028,depth=.006,location=(x,y,.106))
        dot=bpy.context.object; dot.name='watch complication'; dot.data.materials.append(blue if x*y>0 else red)
    # Two woven strap halves attach behind the case; the previous closed tube
    # crossed in front of the display and read as a rubber torus.
    for sign in (-1,1):
        strap=rounded_box(.22,.66,.045,.055,6,'woven strap half')
        strap.location=(0,sign*.63,-.035); strap.data.materials.append(orange)
        # Raised horizontal weave ribs.
        for i in range(7):
            rib=rounded_box(.205,.012,.052,.005,2,'strap weave')
            rib.location=(0,sign*(.34+i*.085),-.035); rib.data.materials.append(orange)
    # Titanium loop and hook on the upper half.
    for y in (.88,1.0):
        bpy.ops.mesh.primitive_torus_add(major_radius=.105,minor_radius=.012,major_segments=24,minor_segments=6,
            location=(0,y,-.035),rotation=(math.pi/2,0,0)); bpy.context.object.scale.y=.42; bpy.context.object.data.materials.append(titanium)
    # Digital crown, crown guard and side button on the right edge.
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.058,depth=.075,location=(.31,.1,0),rotation=(0,math.pi/2,0)); crown=assign(bpy.context.object,titanium)
    crown.name='knurled digital crown'
    for i in range(18):
        a=i*math.pi*2/18
        rib=rounded_box(.012,.008,.075,.002,1,'crown knurl'); rib.location=(.35,.1+math.cos(a)*.055,math.sin(a)*.055); rib.data.materials.append(black)
    guard=assign(loft_sections([
      [( .268,.018,-.065),( .34,.025,-.065),( .36,.185,-.065),( .268,.19,-.065)],
      [( .268,.018,.065),( .34,.025,.065),( .36,.185,.065),( .268,.19,.065)]
    ],'crown protection bridge'),titanium)
    side_btn=rounded_box(.052,.1,.035,.012,3,'side button'); side_btn.location=(.306,-.11,0); side_btn.data.materials.append(titanium)
    # Orange action button on the opposite flank.
    action=rounded_box(.035,.115,.045,.014,3,'orange action button'); action.location=(-.294,.02,0); action.data.materials.append(orange)
    # Speaker grille and microphone openings.
    for i in range(6):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.009,depth=.012,location=(-.296,-.13+i*.035,0),rotation=(0,math.pi/2,0))
        bpy.context.object.data.materials.append(black)
    # Ceramic back and optical sensor cluster.
    ceramic=mat('ceramic back',(.86,.86,.82),0,.2)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=.19,depth=.018,location=(0,0,-.086)); assign(bpy.context.object,ceramic)
    for i in range(8):
        a=i*math.pi/4
        bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.018,depth=.008,location=(math.cos(a)*.105,math.sin(a)*.105,-.099))
        assign(bpy.context.object,screen)

def glasses():
    shell=mat('HoloLens shell',(.12,.14,.16),.35,.32); visor=mat('waveguide visor',(.03,.18,.24),.25,.08,.48,.25)
    black=mat('sensor black',(.008,.012,.016),.3,.2); lens=mat('optical lens',(.006,.03,.055),.15,.06)
    # True wraparound visor: a quad strip whose depth bows forward at centre.
    verts=[]; n=32
    for i in range(n):
        t=i/(n-1); x=-.76+t*1.52; bow=.55+.22*(1-(x/.76)**2)
        top=.24-.04*(abs(x)/.76); bottom=-.22+.055*(abs(x)/.76)
        verts.extend([(x,bottom,bow),(x,top,bow)])
    faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(n-1)]
    mesh=bpy.data.meshes.new('curved visor mesh'); mesh.from_pydata(verts,[],faces); mesh.update()
    ob=bpy.data.objects.new('single wraparound visor',mesh); bpy.context.collection.objects.link(ob); ob.data.materials.append(visor)
    solid=ob.modifiers.new('visor thickness','SOLIDIFY'); solid.thickness=.018
    bevel=ob.modifiers.new('visor edge softness','BEVEL'); bevel.width=.014; bevel.segments=3

    # Separate left/right waveguides visible behind the protective visor.
    for side in (-1,1):
        wg=rounded_box(.29,.16,.014,.045,8,'holographic waveguide')
        wg.location=(side*.19,.01,.535); wg.data.materials.append(lens)
        # Eye-tracking camera on the inner lower corner.
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=.026,location=(side*.09,-.12,.56))
        bpy.context.object.scale=(1,.65,.45); bpy.context.object.data.materials.append(black)

    # Carbon head band, crown pad and side rails.
    assign(bezier_tube([(-.68,.08,.42),(-.67,.22,.02),(0,.33,-.52),(.67,.22,.02),(.68,.08,.42)],.045,16,'adjustable head band'),shell)
    pad=rounded_box(.54,.09,.12,.035,5,'forehead comfort pad'); pad.location=(0,.24,.25); pad.data.materials.append(shell)
    for side in (-1,1):
        assign(bezier_tube([(side*.69,.08,.4),(side*.72,.08,.05),(side*.58,.08,-.43)],.035,12,'side audio rail'),shell)
        # Flip-up visor hinge.
        bpy.ops.mesh.primitive_cylinder_add(vertices=28,radius=.075,depth=.055,location=(side*.7,.15,.31),rotation=(0,math.pi/2,0))
        bpy.context.object.data.materials.append(shell)
        # Directional speaker above each ear.
        speaker=rounded_box(.16,.085,.075,.03,5,'directional speaker'); speaker.location=(side*.59,.0,-.24); speaker.data.materials.append(black)

    # Six recognisable front sensors: four tracking, RGB and ToF.
    sensor_positions=[(-.5,.15,.76),(-.28,.2,.78),(.28,.2,.78),(.5,.15,.76),(0,.18,.79),(0,-.12,.78)]
    for idx,(x,y,z) in enumerate(sensor_positions):
        bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.028 if idx<4 else .038,depth=.018,location=(x,y,z),rotation=(math.pi/2,0,0))
        bpy.context.object.data.materials.append(lens)

    # Rear battery balances the visor 50:50; include the ratchet dial.
    battery=rounded_box(.48,.2,.16,.07,8,'rear battery housing'); battery.location=(0,.08,-.53); battery.data.materials.append(shell)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.085,depth=.05,location=(0,.08,-.64),rotation=(math.pi/2,0,0))
    dial=bpy.context.object; dial.name='rear adjustment dial'; dial.data.materials.append(black)

def robot_humanoid():
    white=mat('G1 magnesium shell',(.72,.75,.76),.55,.3); dark=mat('joint housings',(.035,.04,.045),.65,.27)
    # Torso and pelvis use tapered multi-section housings.
    torso=[uv_ring(0,y,rx,rz,14,.72) for y,rx,rz in [(.72,.16,.12),(.9,.2,.14),(1.08,.24,.14),(1.22,.18,.12)]]
    assign(loft_sections(torso,'G1 tapered torso'),white)
    head=[uv_ring(0,y,rx,rz,14,.8) for y,rx,rz in [(1.23,.12,.1),(1.31,.14,.12),(1.39,.1,.1)]]
    assign(loft_sections(head,'sensor head'),dark)
    def limb(points,radii,name):
        for a,b,r in zip(points,points[1:],radii): assign(bezier_tube([a,((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),b],r,12,name),white)
        for p in points[1:-1]:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=radii[0]*1.28,location=p); assign(bpy.context.object,dark)
    for s in (-1,1):
        limb([(s*.22,1.12,0),(s*.3,.88,.035),(s*.27,.61,-.02),(s*.26,.5,.04)],[.055,.05,.04],'articulated arm')
        limb([(s*.105,.73,0),(s*.12,.46,.025),(s*.105,.2,-.015),(s*.11,.035,.09)],[.075,.065,.05],'articulated leg')

def robot_dog():
    black=mat('Go2 shell',(.025,.03,.035),.55,.24); alu=mat('joint alloy',(.32,.35,.37),.8,.2)
    body=[uv_ring(x,.42,ry,rz,16,.68) for x,ry,rz in [(-.38,.18,.22),(-.25,.24,.28),(.28,.24,.28),(.42,.16,.19)]]
    assign(loft_sections(body,'Go2 monocoque torso'),black)
    head=[uv_ring(x,.43,ry,rz,14,.75) for x,ry,rz in [(.36,.16,.18),(.51,.2,.21),(.62,.13,.16)]]
    assign(loft_sections(head,'lidar head'),black)
    for x in (-.27,.29):
      for z in (-.22,.22):
        knee=(x+(.07 if x>0 else -.07),.2,z); foot=(x+(.02 if x>0 else -.02),.025,z)
        assign(bezier_tube([(x,.4,z),knee,foot],.045,12,'dog leg'),black)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=18,ring_count=9,radius=.07,location=knee); assign(bpy.context.object,alu)

def chair():
    black=mat('black 3D printed ABS',(.012,.014,.016),0,.34)
    ivory=mat('ivory 3D printed ABS',(.86,.84,.77),0,.38)
    # Makerchair Jigsaw is a single Panton-like cantilever ribbon assembled
    # from printed parts.  The side centreline sweeps from the floor contact,
    # under the seat and continuously into the back: there are no four legs.
    centre=[(.34,.025),(.05,.025),(-.22,.08),(-.34,.25),(-.31,.43),
            (-.10,.51),(.18,.52),(.30,.61),(.32,.82),(.27,1.04)]
    thickness=.055
    left=[]; right=[]
    for i,p in enumerate(centre):
        p0=Vector(centre[max(0,i-1)]); p1=Vector(centre[min(len(centre)-1,i+1)])
        tangent=(p1-p0).normalized(); normal=Vector((-tangent.y,tangent.x))*thickness
        left.append((p[0]+normal.x,p[1]+normal.y)); right.append((p[0]-normal.x,p[1]-normal.y))
    side_profile=left+list(reversed(right))
    sections=[]
    for z in (-.305,-.20,0,.20,.305):
        # Slightly crowned width like the museum prototype.
        crown=.012*(1-(z/.305)**2)
        sections.append([(x,y+crown,z) for x,y in side_profile])
    assign(loft_sections(sections,'continuous S curve structural shell'),black)

    # Individually modelled surface modules.  Each tile follows one interval
    # of the S curve and one band across the chair width, creating the actual
    # black/white assembled topology rather than a painted checker texture.
    def tile_prism(a,b,z0,z1,outward,material,row,col):
        va=Vector(a); vb=Vector(b); tangent=(vb-va).normalized()
        n=Vector((-tangent.y,tangent.x))*outward
        gap=.006
        za=z0+gap; zb=z1-gap
        q=[(va.x+n.x,va.y+n.y,za),(vb.x+n.x,vb.y+n.y,za),
           (vb.x+n.x,vb.y+n.y,zb),(va.x+n.x,va.y+n.y,zb)]
        n2=n*1.16
        q2=[(va.x+n2.x,va.y+n2.y,za),(vb.x+n2.x,vb.y+n2.y,za),
            (vb.x+n2.x,vb.y+n2.y,zb),(va.x+n2.x,va.y+n2.y,zb)]
        verts=q+q2; faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
        me=bpy.data.meshes.new(f'puzzle module mesh {row}-{col}'); me.from_pydata(verts,[],faces); me.update()
        ob=bpy.data.objects.new(f'interlocking puzzle module {row}-{col}',me); bpy.context.collection.objects.link(ob)
        ob.data.materials.append(material)
    bands=[-.30,-.20,-.10,0,.10,.20,.30]
    for i in range(len(centre)-1):
        for j in range(len(bands)-1):
            material=ivory if (i+j)%2==0 else black
            tile_prism(centre[i],centre[i+1],bands[j],bands[j+1],thickness+.007,material,i,j)
            tile_prism(centre[i],centre[i+1],bands[j],bands[j+1],-thickness-.007,
                       ivory if (i+j)%2 else black,i+20,j)
            # Circular male connector at alternating seams makes the jigsaw
            # assembly legible from a normal gallery viewing distance.
            if i>0 and (i+j)%2==0:
                p=Vector(centre[i]); prev=Vector(centre[i-1]); nxt=Vector(centre[i+1])
                tangent=(nxt-prev).normalized(); normal=Vector((-tangent.y,tangent.x))*(thickness+.015)
                bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.018,depth=.012,
                    location=(p.x+normal.x,p.y+normal.y,(bands[j]+bands[j+1])*.5),rotation=(math.pi/2,0,0))
                nub=bpy.context.object; nub.name='puzzle connector'; nub.data.materials.append(material)

def table():
    # Aduatz/incremental3d Gradient piece: an elongated, low concrete bridge
    # built from visible 8 mm extrusion courses.  The opening below the top is
    # structural, while the end piers swell and twist instead of reading as
    # four conventional furniture legs.
    palette=[]
    stops=[(.08,.16,.22),(.08,.34,.38),(.28,.5,.42),(.72,.65,.48),(.56,.18,.16)]
    for i,c in enumerate(stops): palette.append(mat(f'dyed concrete {i}',c,0,.72))

    def mix_color(t):
        p=t*(len(stops)-1); k=min(len(stops)-2,int(p)); f=p-k
        a=stops[k]; b=stops[k+1]
        return tuple(a[j]*(1-f)+b[j]*f for j in range(3))

    def printed_disc(cx,y,rx,rz,h,material,name,phase=0):
        n=32; rings=[]
        for yy in (y-h*.5,y+h*.5):
            pts=[]
            for i in range(n):
                a=2*math.pi*i/n
                # Slight robotic-toolpath ripple, kept small enough to remain
                # credible as cement mortar rather than decorative scallops.
                ripple=1+.018*math.sin(3*a+phase)
                pts.append((cx+math.cos(a)*rx*ripple,yy,math.sin(a)*rz*ripple))
            rings.append(pts)
        return assign(loft_sections(rings,name),material)

    layer_h=.009
    # Two organic end piers, course by course.  Their opposing lean produces
    # the characteristic continuous bridge silhouette and central void.
    for li in range(34):
        y=.008+li*layer_h; t=li/33
        for side in (-1,1):
            cx=side*(.59-.11*t)+.018*math.sin(t*math.pi*2)*side
            rx=.17+.075*t; rz=.255-.025*t+.012*math.sin(t*math.pi)
            color=mat(f'gradient pier {li}-{side}',mix_color((cx+.78)/1.56),0,.74)
            printed_disc(cx,y,rx,rz,layer_h*.82,color,'printed concrete pier course',li*.35)

    # The upper twelve courses span the full 1.49 m length.  They are divided
    # longitudinally so pigment changes continuously from blue/green through
    # warm mineral beige to red, matching dye injection at the nozzle.
    for li in range(12):
        y=.314+li*layer_h
        for si in range(13):
            x0=-.745+si*(1.49/13); x1=-.745+(si+1)*(1.49/13)
            col=mat(f'top gradient {li}-{si}',mix_color((si+.5)/13),0,.7)
            slab=rounded_box((x1-x0)*.98,layer_h*.82,.556,.004,2,'continuous top print course')
            slab.location=((x0+x1)*.5,y,0); slab.data.materials.append(col)
    # Fine dark seams make the deposited mortar courses legible in gallery
    # lighting without replacing the actual layered geometry.
    seam=mat('shadow between print courses',(.025,.03,.032),0,.9)
    for li in range(1,46,2):
        y=.008+li*layer_h
        if y<.31:
            for side in (-1,1):
                cx=side*(.59-.11*min(1,y/.31)); printed_disc(cx,y,.19,.25,.0015,seam,'extrusion layer seam',li)

BUILDERS={'concept-car':concept_car,'evtol-aircraft':evtol,'smart-watch':watch,'ar-glasses':glasses,
          'humanoid-robot':robot_humanoid,'robot-dog':robot_dog,'printed-chair':chair,'lattice-table':table}

def prepare_gltf_y_up():
    """Models above are authored X-length/Y-height/Z-depth for readability.
    Rotate the complete exhibit to Blender Z-up before glTF's Y-up conversion.
    Works for meshes and curve-based trim/details as one rigid assembly.
    """
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = next(iter(bpy.context.selected_objects), None)
    bpy.ops.transform.rotate(value=math.pi/2, orient_axis='X')
    # Keep the assembly rotation non-destructive: applying transforms is not
    # supported by Blender for filled 2D curve objects (the HoloLens visor),
    # while glTF exports object rotations correctly.

requested=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for name,builder in BUILDERS.items():
    if requested and name not in requested: continue
    purge(); builder(); prepare_gltf_y_up(); os.makedirs(OUT,exist_ok=True); export_glb(os.path.join(OUT,name+'.glb')); print('exported',name)
