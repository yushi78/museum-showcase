/**
 * 相机控制：漫游（WASD + 鼠标 + 碰撞）/ 导览（路点巡游）
 * 俯瞰模式直接用 vendor 的 OrbitControls
 */
import * as THREE from 'three';

const EYE = 1.62;          // 视高
const RADIUS = 0.45;       // 碰撞半径
const ACCEL = 46;
const DAMP = 11;
const SPEED = 3.4;
const SPRINT = 2.1;

/* ==================================================================== */
/* 漫游                                                                  */
/* ==================================================================== */

export class RoamControls {
  constructor(camera, dom, { colliders = [], bounds, spawn }) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.bounds = bounds;           // {w, d}
    this.enabled = false;
    this.locked = false;

    this.yaw = spawn?.yaw ?? 0;
    this.pitch = -0.04;
    this.vel = new THREE.Vector3();
    this.pos = new THREE.Vector3(spawn?.pos?.[0] ?? 0, EYE, spawn?.pos?.[1] ?? 0);
    this.keys = Object.create(null);
    this.touchMove = { x: 0, y: 0 };   // 移动端摇杆输入 [-1,1]
    this.sensitivity = 0.0022;

    this._onKeyDown = (e) => {
      if (!this.enabled) return;
      this.keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    this._onMouseMove = (e) => {
      if (!this.enabled) return;
      if (!this.locked && !this._dragging) return;
      const dx = e.movementX ?? 0, dy = e.movementY ?? 0;
      this.yaw -= dx * this.sensitivity;
      this.pitch -= dy * this.sensitivity;
      this.pitch = Math.max(-1.35, Math.min(1.2, this.pitch));
    };
    this._onLockChange = () => {
      this.locked = document.pointerLockElement === this.dom;
      this.onLockChange?.(this.locked);
    };
    // 未锁定时也支持按住拖拽转视角（触屏 / 不想锁指针的用户）
    this._onPointerDown = (e) => {
      if (!this.enabled || this.locked) return;
      if (e.pointerType === 'touch' && e.target.closest('.stick')) return;
      this._dragging = true;
      this._lastP = { x: e.clientX, y: e.clientY };
    };
    this._onPointerMove = (e) => {
      if (!this._dragging || !this.enabled) return;
      const dx = e.clientX - this._lastP.x, dy = e.clientY - this._lastP.y;
      this._lastP = { x: e.clientX, y: e.clientY };
      this.yaw -= dx * 0.0042;
      this.pitch = Math.max(-1.35, Math.min(1.2, this.pitch - dy * 0.0042));
      this._moved = true;
    };
    this._onPointerUp = () => { this._dragging = false; };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onLockChange);
    dom.addEventListener('pointerdown', this._onPointerDown);
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  }

  requestLock() { if (this.enabled) this.dom.requestPointerLock?.(); }
  releaseLock() { if (document.pointerLockElement === this.dom) document.exitPointerLock?.(); }

  setEnabled(on, spawn) {
    this.enabled = on;
    if (on && spawn) {
      this.pos.set(spawn.pos[0], EYE, spawn.pos[1]);
      this.yaw = spawn.yaw ?? 0;
      this.pitch = -0.04;
      this.vel.set(0, 0, 0);
    }
    if (!on) this.releaseLock();
  }

  /** 从任意相机姿态接管（模式切换时保持连续） */
  adoptFrom(camera) {
    this.pos.set(camera.position.x, EYE, camera.position.z);
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    this.yaw = e.y;
    this.pitch = Math.max(-1.35, Math.min(1.2, e.x));
    this.vel.set(0, 0, 0);
    this._resolve();
  }

  _resolve() {
    // 房间边界
    const hw = this.bounds.w / 2 - RADIUS - 0.25;
    const hd = this.bounds.d / 2 - RADIUS - 0.25;
    this.pos.x = Math.max(-hw, Math.min(hw, this.pos.x));
    this.pos.z = Math.max(-hd, Math.min(hd, this.pos.z));

    // 圆 vs AABB 推出
    for (const c of this.colliders) {
      const cx = Math.max(c.minX, Math.min(this.pos.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(this.pos.z, c.maxZ));
      let dx = this.pos.x - cx, dz = this.pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= RADIUS * RADIUS) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        this.pos.x = cx + (dx / d) * RADIUS;
        this.pos.z = cz + (dz / d) * RADIUS;
      } else {
        // 圆心在盒内：沿最短轴推出
        const l = this.pos.x - c.minX, r = c.maxX - this.pos.x;
        const b = this.pos.z - c.minZ, t = c.maxZ - this.pos.z;
        const m = Math.min(l, r, b, t);
        if (m === l) this.pos.x = c.minX - RADIUS;
        else if (m === r) this.pos.x = c.maxX + RADIUS;
        else if (m === b) this.pos.z = c.minZ - RADIUS;
        else this.pos.z = c.maxZ + RADIUS;
      }
    }
  }

  update(dt) {
    if (!this.enabled) return;
    const k = this.keys;
    let fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    let str = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    fwd += this.touchMove.y;
    str += this.touchMove.x;
    const len = Math.hypot(fwd, str);
    if (len > 1) { fwd /= len; str /= len; }

    const sp = SPEED * (k.ShiftLeft || k.ShiftRight ? SPRINT : 1);
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // yaw=0 时朝 -Z
    const wishX = (-sin * fwd + cos * str) * sp;
    const wishZ = (-cos * fwd - sin * str) * sp;

    this.vel.x += (wishX - this.vel.x) * Math.min(1, ACCEL * dt / Math.max(sp, 0.001));
    this.vel.z += (wishZ - this.vel.z) * Math.min(1, ACCEL * dt / Math.max(sp, 0.001));
    this.vel.x -= this.vel.x * Math.min(1, DAMP * dt) * (len ? 0 : 1);
    this.vel.z -= this.vel.z * Math.min(1, DAMP * dt) * (len ? 0 : 1);

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this._resolve();

    // 轻微步伐晃动
    const speed = Math.hypot(this.vel.x, this.vel.z);
    this._bob = (this._bob || 0) + dt * speed * 6.2;
    const bob = speed > 0.2 ? Math.sin(this._bob) * 0.022 : 0;

    this.camera.position.set(this.pos.x, EYE + bob, this.pos.z);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }

  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    this.dom.removeEventListener('pointerdown', this._onPointerDown);
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  }
}

/* ==================================================================== */
/* 导览                                                                  */
/* ==================================================================== */

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class TourController {
  constructor(camera, waypoints, { dwell = 5.0, travel = 3.2 } = {}) {
    this.camera = camera;
    this.wps = waypoints;
    this.dwell = dwell;
    this.travelTime = travel;
    this.index = -1;
    this.state = 'idle';        // idle | travel | dwell
    this.t = 0;
    this.enabled = false;
    this.paused = false;
    this.from = { eye: new THREE.Vector3(), look: new THREE.Vector3() };
    this.to = { eye: new THREE.Vector3(), look: new THREE.Vector3() };
    this._look = new THREE.Vector3();
  }

  start(fromCamera, startIndex = 0) {
    this.enabled = true;
    this.paused = false;
    this.from.eye.copy(fromCamera.position);
    const d = new THREE.Vector3(0, 0, -1).applyQuaternion(fromCamera.quaternion);
    this.from.look.copy(fromCamera.position).add(d.multiplyScalar(4));
    this._look.copy(this.from.look);
    this.goto(startIndex, true);
  }

  goto(i, keepFrom = false) {
    if (!this.wps.length) return;
    this.index = ((i % this.wps.length) + this.wps.length) % this.wps.length;
    const w = this.wps[this.index];
    if (!keepFrom) {
      this.from.eye.copy(this.camera.position);
      this.from.look.copy(this._look);
    }
    this.to.eye.copy(w.eye);
    this.to.look.copy(w.look);
    this.state = 'travel';
    this.t = 0;
    this.onFocus?.(w, this.index);
  }

  next() { this.goto(this.index + 1); }
  prev() { this.goto(this.index - 1); }
  toggle() { this.paused = !this.paused; return this.paused; }
  stop() { this.enabled = false; this.state = 'idle'; }

  update(dt) {
    if (!this.enabled || !this.wps.length) return;
    if (this.state === 'travel') {
      this.t += dt / this.travelTime;
      const k = easeInOut(Math.min(1, this.t));
      // 位移走一段抬升的弧线，避免穿模
      const eye = this.from.eye.clone().lerp(this.to.eye, k);
      eye.y += Math.sin(k * Math.PI) * 0.55;
      this.camera.position.copy(eye);
      this._look.copy(this.from.look).lerp(this.to.look, k);
      this.camera.lookAt(this._look);
      if (this.t >= 1) { this.state = 'dwell'; this.t = 0; this.onArrive?.(this.wps[this.index], this.index); }
    } else if (this.state === 'dwell') {
      if (!this.paused) this.t += dt;
      // 停留时缓慢环绕
      const w = this.wps[this.index];
      const off = this.to.eye.clone().sub(w.look);
      const a = Math.sin(this.t * 0.28) * 0.16;
      const rx = off.x * Math.cos(a) - off.z * Math.sin(a);
      const rz = off.x * Math.sin(a) + off.z * Math.cos(a);
      this.camera.position.set(w.look.x + rx, this.to.eye.y, w.look.z + rz);
      this._look.copy(w.look);
      this.camera.lookAt(this._look);
      if (this.t >= this.dwell && !this.paused) this.next();
    }
  }
}

/* ==================================================================== */
/* 移动端摇杆                                                            */
/* ==================================================================== */

export function bindJoystick(el, onChange) {
  const knob = el.querySelector('.knob');
  let id = null, cx = 0, cy = 0, R = 44;
  const reset = () => { knob.style.transform = 'translate(-50%,-50%)'; onChange(0, 0); };

  el.addEventListener('pointerdown', (e) => {
    id = e.pointerId;
    const r = el.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2;
    el.setPointerCapture(id);
    e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    onChange(dx / R, -dy / R);
    e.preventDefault();
  });
  const end = (e) => { if (e.pointerId === id) { id = null; reset(); } };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
