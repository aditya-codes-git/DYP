import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Plus } from 'lucide-react';

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
	const location = useLocation();

	const isDashboard = location.pathname === '/dashboard';
	const isUpload = location.pathname === '/upload';
	const isReport = location.pathname.startsWith('/report/');
	const isHome = location.pathname === '/';

	const links = isHome ? [
		{ label: 'How It Works', href: '#how-it-works' },
		{ label: 'Features', href: '#features' },
		{ label: 'Contact', href: '#' },
	] : [
		{ label: 'Home', href: '/' },
		...(isDashboard ? [] : [{ label: 'Dashboard', href: '/dashboard' }]),
	];

	// Determine the primary action button based on context
	const primaryButton = (() => {
		if (isDashboard || isReport) {
			return { label: 'New Analysis', href: '/upload', icon: Plus };
		}
		return { label: 'Dashboard', href: '/dashboard' };
	})();

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => { document.body.style.overflow = ''; };
	}, [open]);

	return (
		<div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
			<header
				className={cn(
					'pointer-events-auto w-full max-w-5xl transition-all duration-500 ease-in-out',
					'bg-white/50 backdrop-blur-md border border-white/40 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]',
					'rounded-2xl md:rounded-full',
					{
						'md:max-w-4xl bg-white/80 border-slate-200/60 shadow-lg backdrop-blur-xl': scrolled && !open,
						'fixed inset-0 rounded-none bg-white/95 backdrop-blur-2xl border-none p-0 max-w-none': open,
					},
				)}
			>
			<nav
				className={cn(
					'flex h-16 w-full items-center justify-between px-6 md:h-14 md:transition-all md:ease-out',
					{ 'md:px-4': scrolled }
				)}
			>
				{/* Logo */}
				<Link to="/" className="flex items-center gap-2.5 no-underline hover:opacity-90 transition-opacity">
					<div
						className="w-8 h-8 flex items-center justify-center rounded-lg shadow-[0_2px_10px_rgba(99,102,241,0.2)]"
						style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
					>
						<Shield className="w-4 h-4 text-white" />
					</div>
					<span className="text-[17px] font-bold text-slate-800 tracking-tight">
						Forens<span className="text-indigo-600">IQ</span>
					</span>
				</Link>

				<div className="hidden items-center gap-2 md:flex">
					{links.map((link, i) => (
						link.href.startsWith('#') ? (
							<a key={i} className={cn(buttonVariants({ variant: 'ghost' }), "text-slate-600 hover:text-slate-900")} href={link.href}>
								{link.label}
							</a>
						) : (
							<Link key={i} className={cn(buttonVariants({ variant: 'ghost' }), "text-slate-600 hover:text-slate-900")} to={link.href}>
								{link.label}
							</Link>
						)
					))}
					<div className="w-[1px] h-4 bg-slate-200 mx-2" />
					<Link to={primaryButton.href} className={buttonVariants({ variant: 'default', className: 'rounded-full px-6 shadow-sm flex items-center gap-2' })}>
						{primaryButton.icon && <primaryButton.icon className="w-4 h-4" />}
						{primaryButton.label}
					</Link>
				</div>
				<Button size="icon" variant="ghost" onClick={() => setOpen(!open)} className="md:hidden hover:bg-slate-100">
					<MenuToggleIcon open={open} className="size-5 text-slate-700" duration={300} />
				</Button>
			</nav>

			{/* Mobile Menu */}
			<div
				className={cn(
					'bg-white/95 fixed top-16 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-t border-slate-100 backdrop-blur-xl md:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:slide-in-from-top-2 data-[slot=closed]:animate-out data-[slot=closed]:slide-out-to-top-2 ease-out',
						'flex h-full w-full flex-col p-6 space-y-6',
					)}
				>
					<div className="grid gap-y-3">
						{links.map((link, i) => (
							link.href.startsWith('#') ? (
								<a
									key={i}
									className="text-lg font-medium text-slate-700 px-3 py-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100"
									href={link.href}
									onClick={() => setOpen(false)}
								>
									{link.label}
								</a>
							) : (
								<Link
									key={i}
									className="text-lg font-medium text-slate-700 px-3 py-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100"
									to={link.href}
									onClick={() => setOpen(false)}
								>
									{link.label}
								</Link>
							)
						))}
					</div>
					<div className="flex flex-col gap-3 pt-6">
						<Link 
							to={primaryButton.href} 
							className={buttonVariants({ variant: 'default', size: 'lg', className: 'w-full py-6 text-[16px] rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700' })}
							onClick={() => setOpen(false)}
						>
							{primaryButton.label}
						</Link>
					</div>
				</div>
			</div>
		</header>
		</div>
	);
}
