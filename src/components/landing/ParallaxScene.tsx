"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

// Parallaxe au curseur.
//
// La scène mesure la position de la souris dans son propre cadre et la
// normalise entre -0,5 et +0,5 sur chaque axe. Chaque calque se déplace de
// « position x amplitude » : c'est l'écart d'amplitude entre les calques, et
// lui seul, qui produit la profondeur. Un calque de fond bouge peu, un élément
// au premier plan bouge beaucoup, et l'oeil lit les deux comme deux distances.
//
// Deux règles à ne pas contourner si on ajoute des calques :
//   1. Rien qui se lise ne bouge. Un titre ou un paragraphe qui glisse sous le
//      regard rend la lecture pénible. On ne déplace que du décor et des blocs
//      qu'on regarde sans lire.
//   2. Les amplitudes restent ordonnées de l'arrière vers l'avant. Deux calques
//      voisins avec la même amplitude ne créent aucune profondeur, ils font
//      juste bouger la page.

type Pointer = { x: MotionValue<number>; y: MotionValue<number> };

const PointerContext = createContext<Pointer | null>(null);

// Ressort suramorti (ratio d'amortissement ~1,3) : le calque glisse vers la
// position visée et s'y pose sans rebondir. Un suivi direct, sans ressort,
// donne un mouvement mécanique collé au curseur ; c'est le retard du ressort
// qui rend le geste vivant, et l'absence de rebond qui l'empêche de faire
// gadget.
const SPRING = { stiffness: 70, damping: 20, mass: 0.8 } as const;

export function ParallaxScene({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduced) return;
    // Souris fine et écran large seulement. Sur tactile l'effet n'a pas de
    // déclencheur, et en dessous de 1024 px la scène est empilée en une seule
    // colonne : il n'y a plus de profondeur à donner, seulement du tremblement.
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduced]);

  return (
    <PointerContext.Provider value={{ x, y }}>
      <div
        ref={ref}
        className={className}
        onMouseMove={
          enabled
            ? (e) => {
                const el = ref.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                rawX.set((e.clientX - r.left) / r.width - 0.5);
                rawY.set((e.clientY - r.top) / r.height - 0.5);
              }
            : undefined
        }
        onMouseLeave={
          enabled
            ? () => {
                rawX.set(0);
                rawY.set(0);
              }
            : undefined
        }
      >
        {children}
      </div>
    </PointerContext.Provider>
  );
}

export function ParallaxLayer({
  depth,
  tilt = 0,
  base = "",
  className,
  style,
  children,
  "aria-hidden": ariaHidden,
}: {
  /** Course totale du calque, en pixels, d'un bord à l'autre de la scène. */
  depth: number;
  /** Rotation maximale en degrés, pilotée par l'axe horizontal seulement. */
  tilt?: number;
  /** Transformation statique à conserver, par exemple un centrage en translateX(-50%). */
  base?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  "aria-hidden"?: boolean;
}) {
  // Les valeurs de repli servent quand un calque est monté hors d'une scène :
  // il reste immobile au lieu de planter. Les hooks doivent être appelés dans
  // tous les cas, d'où ces deux valeurs créées systématiquement.
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const pointer = useContext(PointerContext);
  const px = pointer?.x ?? fallbackX;
  const py = pointer?.y ?? fallbackY;

  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);
  const rotate = useTransform(px, (v) => v * -tilt);
  // Chaîne transform complète plutôt que les raccourcis x/y de framer-motion :
  // translate3d part sur le compositeur, donc le mouvement tient même quand le
  // fil principal travaille.
  const transform = useMotionTemplate`${base} translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;

  return (
    <motion.div
      aria-hidden={ariaHidden}
      className={className}
      style={{ ...style, transform }}
    >
      {children}
    </motion.div>
  );
}
