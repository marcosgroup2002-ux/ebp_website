const BAR_ANIMATIONS = ["animate-wave1", "animate-wave2", "animate-wave3", "animate-wave4", "animate-wave5"];

/**
 * Petit motif de forme d'onde vocale : le signal visuel signature d'EBP.
 * Rappelle la promesse "60% pratique orale" partout où il apparaît :
 * eyebrows de section, badges, boutons flottants.
 */
export default function Waveform({ color = "bg-ebp-green", className = "", barClassName = "w-[3px] h-4" }) {
  return (
    <span className={`inline-flex items-end gap-[3px] ${className}`} aria-hidden="true">
      {BAR_ANIMATIONS.map((anim, i) => (
        <span key={i} className={`${barClassName} ${color} rounded-full ${anim}`} />
      ))}
    </span>
  );
}
