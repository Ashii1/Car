import * as THREE from 'three';
import { TrackWorld } from '../3d/TrackBuilder';
import { TrafficCarInstance, createTrafficCar } from '../3d/TrafficCarBuilder';
import { TimeOfDay, WeatherType } from '../types/openCity';

export class TrafficManager {
  public cars: TrafficCarInstance[] = [];
  private track: TrackWorld;
  private scene: THREE.Scene;
  private lanes = [-3.8, 0, 3.8];
  private isRaining = false;

  constructor(scene: THREE.Scene, track: TrackWorld) {
    this.scene = scene;
    this.track = track;
  }

  public initTraffic(count: number = 10) {
    this.clear();
    const types: ('sedan' | 'suv' | 'truck')[] = ['sedan', 'suv', 'truck', 'sedan', 'suv'];
    const trackLen = this.track.totalLength;

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const car = createTrafficCar(type);
      car.lane = this.lanes[i % this.lanes.length];
      // Evenly distribute cars along track length
      car.trackProgress = (i / count) * trackLen + Math.random() * 50;

      this.scene.add(car.group);
      this.cars.push(car);
    }
  }

  public update(delta: number, playerDistance: number, playerOffset: number) {
    const trackLen = this.track.totalLength;

    this.cars.forEach((car) => {
      // Civilian cars cruise along the road (reduced speed in rain)
      const currentSpeed = this.isRaining ? car.speed * 0.7 : car.speed;
      car.trackProgress = (car.trackProgress + (currentSpeed / 3.6) * delta) % trackLen;

      // Update wheels rotation and active windshield wipers in rain
      car.updateWheels(delta, this.isRaining);

      // Check if player is right behind or passing close to car
      const distToPlayer = (playerDistance - car.trackProgress + trackLen) % trackLen;
      const isCloseBehind = distToPlayer < 20 && distToPlayer > 0 && Math.abs(car.lane - playerOffset) < 1.8;

      if (isCloseBehind) {
        car.brakeLight(true);
      } else {
        car.brakeLight(false);
      }

      // Position along 3D track spline
      const pt = this.track.getTrackPointAtProgress(car.trackProgress);
      const pos = pt.position.clone().addScaledVector(pt.binormal, car.lane);
      car.group.position.copy(pos);

      // Orient car along track tangent
      car.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pt.tangent);
    });
  }

  public checkPlayerCollision(
    playerDistance: number,
    playerOffset: number
  ): { collided: boolean; hitCar?: TrafficCarInstance } {
    const trackLen = this.track.totalLength;

    for (const car of this.cars) {
      let deltaDist = Math.abs(playerDistance - car.trackProgress);
      if (deltaDist > trackLen / 2) deltaDist = trackLen - deltaDist;

      const deltaOffset = Math.abs(playerOffset - car.lane);

      // Hit box test: 3.2m length, 1.4m width
      if (deltaDist < 3.2 && deltaOffset < 1.4) {
        return { collided: true, hitCar: car };
      }
    }

    return { collided: false };
  }

  public updateLighting(timeOfDay: TimeOfDay, weather: WeatherType) {
    this.isRaining = weather === 'rain' || (weather as any) === 'nightRain';
    this.cars.forEach((c) => {
      c.updateLighting?.(timeOfDay, weather);
    });
  }

  public clear() {
    this.cars.forEach((c) => {
      this.scene.remove(c.group);
      c.dispose();
    });
    this.cars = [];
  }
}
