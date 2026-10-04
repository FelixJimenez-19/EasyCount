import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="es">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
                <meta
                    name="description"
                    content="EasyCount: registra tus cierres de caja, lleva el control de billetes y monedas, y sincroniza tus conteos de forma simple y segura."
                />
                <meta name="theme-color" content="#0f172a" />
                <ScrollViewStyleReset />
            </head>
            <body>{children}</body>
        </html>
    );
}
