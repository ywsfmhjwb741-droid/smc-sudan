import Link from "next/link";
import { Zap } from "lucide-react";
export function Footer() {
  return (
    <footer className="border-t border-bg-border bg-bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-text-primary text-lg">
                SMC Sudan MOBA Community
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Sudan&apos;s premier MLBB leaderboard and player tracking platform.
              Built for the community, by the community.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary text-sm mb-4">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/players", label: "Players" },
                { href: "/seasons", label: "Seasons" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-text-secondary text-sm hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary text-sm mb-4">Community</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.gg/sVzkQUG9r" className="text-text-secondary text-sm hover:text-text-primary transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/share/1ByVT4kKz3/" className="text-text-secondary text-sm hover:text-text-primary transition-colors">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="glow-line mt-10 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} SMC Sudan MOBA Community. Not affiliated with Moonton.
          </p>
          <p className="text-text-muted text-xs">
            Built with ❤️ for the Sudanese MLBB community
          </p>
        </div>
      </div>
    </footer>
  );
}
