
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Banknote,
  BookOpen,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Users,
  Wallet,
  FileText,
  Book,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppProvider } from '@/context/app-context';
import { Logo } from '@/components/icons';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser } from '@/firebase/auth/use-user';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/payments', icon: Wallet, label: 'Payments' },
  { href: '/students', icon: Users, label: 'Students' },
  { href: '/banking', icon: Banknote, label: 'Banking' },
  { href: '/reports', icon: BookOpen, label: 'Reports' },
  { href: '/statements', icon: Book, label: 'Statements' },
  { href: '/notes', icon: FileText, label: 'Notes' },
  { href: '/admin', icon: Settings, label: 'Admin' },
];

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/payments': 'Fee Payments',
  '/students': 'Student Management',
  '/banking': 'Banking & Transactions',
  '/reports': 'Financial Reports',
  '/statements': 'Financial Statements',
  '/notes': 'Notes',
  '/admin': 'System Administration',
};

function getPageTitle(pathname: string): string {
    if (pathname.startsWith('/students/')) {
        return 'Student Profile';
    }
    return pageTitles[pathname] || 'SwiftFee Manager';
}


function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, signOut } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">SwiftFee Manager</span>
          </Link>
          <TooltipProvider>
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                      pathname.startsWith(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mt-auto h-9 w-9 text-muted-foreground hover:text-foreground md:h-8 md:w-8"
                        onClick={signOut}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Sign Out</span>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="#"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">SwiftFee Manager</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-2.5 ${
                      pathname.startsWith(item.href)
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 <Button
                    variant="ghost"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground justify-start"
                    onClick={signOut}
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold md:text-2xl">
                {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="relative ml-auto flex-1 md:grow-0" />
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <AppProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
        <FirebaseErrorListener />
      </AppProvider>
    </FirebaseClientProvider>
  );
}
