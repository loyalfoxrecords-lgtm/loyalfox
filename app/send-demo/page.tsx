import type { Metadata } from "next";
import SendDemo from "@/components/SendDemo";

export const metadata: Metadata = {
  title: "Enviar demo",
  description: "¿Produces música electrónica? Envíanos tu demo y únete a LoyalFox Records. Distribución global en más de 100 plataformas, 60% de regalías para el artista.",
  openGraph: {
    title: "Enviar demo | LoyalFox Records",
    description: "Únete al sello. Distribución global, 60% regalías, sin contrato de artista.",
    url: "https://www.loyalfoxrecords.com/send-demo",
  },
};

export default function Page() {
  return <SendDemo />;
}
