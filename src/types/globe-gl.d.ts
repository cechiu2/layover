declare module 'globe.gl' {
  interface GlobeMaterial {
    color?: { set: (color: string) => void };
    emissive?: { set: (color: string) => void };
    shininess?: number;
  }

  type Accessor<TValue> = string | number | ((datum: unknown) => TValue);

  export interface GlobeInstance {
    (element: HTMLElement): GlobeInstance;
    _destructor?: () => void;
    backgroundColor: (color: string) => GlobeInstance;
    width: (value: number) => GlobeInstance;
    height: (value: number) => GlobeInstance;
    showAtmosphere: (value: boolean) => GlobeInstance;
    atmosphereColor: (value: string) => GlobeInstance;
    atmosphereAltitude: (value: number) => GlobeInstance;
    globeImageUrl: (value: string | null) => GlobeInstance;
    bumpImageUrl: (value: string | null) => GlobeInstance;
    globeMaterial: () => GlobeMaterial;
    arcsData: (data: unknown[]) => GlobeInstance;
    arcStartLat: (value: Accessor<number>) => GlobeInstance;
    arcStartLng: (value: Accessor<number>) => GlobeInstance;
    arcEndLat: (value: Accessor<number>) => GlobeInstance;
    arcEndLng: (value: Accessor<number>) => GlobeInstance;
    arcColor: (value: Accessor<string | readonly string[]>) => GlobeInstance;
    arcAltitude: (value: Accessor<number>) => GlobeInstance;
    arcStroke: (value: Accessor<number>) => GlobeInstance;
    arcDashLength: (value: Accessor<number>) => GlobeInstance;
    arcDashGap: (value: Accessor<number>) => GlobeInstance;
    arcDashInitialGap: (value: Accessor<number>) => GlobeInstance;
    arcDashAnimateTime: (value: Accessor<number>) => GlobeInstance;
    arcsTransitionDuration: (value: number) => GlobeInstance;
    onArcClick: (callback: (arc: unknown, event: unknown, coords: unknown) => void) => GlobeInstance;
    onArcHover: (callback: (arc: unknown | null) => void) => GlobeInstance;
    pointsData: (data: unknown[]) => GlobeInstance;
    pointLat: (value: Accessor<number>) => GlobeInstance;
    pointLng: (value: Accessor<number>) => GlobeInstance;
    pointColor: (value: Accessor<string>) => GlobeInstance;
    pointAltitude: (value: Accessor<number>) => GlobeInstance;
    pointRadius: (value: Accessor<number>) => GlobeInstance;
    pointsMerge: (value: boolean) => GlobeInstance;
    pointOfView: (position: { lat: number; lng: number; altitude: number }, milliseconds?: number) => GlobeInstance;
    controls: () => {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableDamping: boolean;
      dampingFactor: number;
      minDistance: number;
      maxDistance: number;
    };
  }

  export interface GlobeOptions {
    animateIn?: boolean;
    waitForGlobeReady?: boolean;
  }

  export default function Globe(options?: GlobeOptions): GlobeInstance;
}
