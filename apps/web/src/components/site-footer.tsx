import { Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0 bg-background/50">
      <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center justify-between max-w-7xl w-full gap-4 px-8 md:flex-row md:gap-2 md:px-0 mx-auto">
          <Link href="/" className="mr-6 flex items-center space-x-2 group">
            <div className="relative w-14 h-14 transition-transform group-hover:scale-110">
              <Image
                src="/CELO.png"
                alt="Celo Game Hub"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>{" "}
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="https://x.com/tochukwuonchain"
              className="font-medium underline underline-offset-4"
            >
              devtochukwu
            </a>
            . Powered by Celo and MiniPay.
          </p>
          <p>All right reserved. CGH &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
