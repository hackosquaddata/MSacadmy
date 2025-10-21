export default function BrandLogo({ size = 64, withTagline = false, taglineText = 'Managed by Hackosquad', showWordmark = false }) {
	const px = typeof size === 'number' ? `${size}px` : size;
	return (
		<div className="flex items-center gap-3">
			<div
				className="relative shrink-0 rounded-full overflow-hidden"
				style={{ height: px, width: px }}
				aria-label="MaxSec Academy Logo"
			>
				<img
					src="/logo.png"
					onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.svg'; }}
					alt="MaxSec Academy"
					className="h-full w-full object-cover"
				/>
				{/* subtle ring */}
				<span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/15" />
			</div>
			{(withTagline || showWordmark) && (
				<div className="leading-tight select-none">
					<div className="text-slate-200 font-semibold tracking-wide">MaxSec Academy</div>
					{withTagline && (
						<div className="text-[11px] text-slate-500">{taglineText}</div>
					)}
				</div>
			)}
		</div>
	);
}
