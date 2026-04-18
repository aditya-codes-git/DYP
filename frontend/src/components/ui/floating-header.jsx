import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MenuIcon, ChevronRight, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter, SheetTrigger } from './sheet';
import { Button, buttonVariants } from './button';
import { cn } from '../../lib/utils';

export function FloatingHeader() {
	const [open, setOpen] = React.useState(false);

	const links = [
		{ label: 'How It Works', href: '#how-it-works' },
		{ label: 'Features', href: '#features' },
		{ label: 'Contact', href: '#' },
	];

	return (
		<div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
			<header
				className={cn(
					'pointer-events-auto w-full max-w-5xl transition-all duration-500 ease-in-out',
					'bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
					'rounded-2xl md:rounded-full',
				)}
			>
				<nav className="flex h-16 w-full items-center justify-between px-6 md:h-14">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2.5 no-underline hover:opacity-90 transition-all active:scale-95">
						<div
							className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-xl md:rounded-lg shadow-[0_2px_10px_rgba(99,102,241,0.2)]"
							style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
						>
							<Shield className="w-5 h-5 md:w-4 md:h-4 text-white" />
						</div>
						<span className="text-lg md:text-[17px] font-bold text-slate-800 tracking-tight">
							Forens<span className="text-indigo-600">IQ</span>
						</span>
					</Link>

					{/* Desktop Links */}
					<div className="hidden items-center gap-1 md:flex">
						{links.map((link) => (
							<a
								key={link.label}
								className={cn(
									buttonVariants({ variant: 'ghost', size: 'sm' }),
									"text-slate-600 hover:text-slate-900 font-medium px-4"
								)}
								href={link.href}
							>
								{link.label}
							</a>
						))}
					</div>

					{/* CTA / Mobile Toggle */}
					<div className="flex items-center gap-2">
                        <Link 
                            to="/upload" 
                            className={cn(
                                buttonVariants({ variant: 'default', size: 'sm' }),
                                "hidden md:inline-flex rounded-full px-6 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                            )}
                        >
                            Get Started
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

						<Sheet open={open} onOpenChange={setOpen}>
							<SheetTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="md:hidden hover:bg-slate-100 rounded-xl"
								>
									<MenuIcon className="size-5 text-slate-700" />
								</Button>
							</SheetTrigger>
							<SheetContent
								className="bg-white/95 backdrop-blur-2xl border-none"
								showClose={true}
								side="right"
							>
								<div className="flex flex-col h-full pt-20 pb-10 px-6">
									<div className="flex flex-col gap-y-4 mb-auto">
										{links.map((link) => (
											<a
												key={link.label}
												className="flex items-center justify-between text-xl font-bold text-slate-800 px-4 py-4 hover:bg-slate-50 rounded-2xl transition-all no-underline border-b border-slate-50"
												href={link.href}
												onClick={() => setOpen(false)}
											>
												{link.label}
												<ChevronRight className="w-5 h-5 text-slate-300" />
											</a>
										))}
									</div>
									<SheetFooter className="bg-transparent border-none p-0 flex flex-col gap-4">
										<Link 
											to="/upload" 
											className={cn(
                                                buttonVariants({ variant: 'default', size: 'lg' }),
                                                "w-full py-7 text-lg rounded-2xl shadow-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
                                            )}
											onClick={() => setOpen(false)}
										>
											Get Started
											<ArrowRight className="w-5 h-5" />
										</Link>
									</SheetFooter>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</nav>
			</header>
		</div>
	);
}
