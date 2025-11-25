import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">¡Cuenta Creada!</CardTitle>
            <CardDescription>Por favor verifica tu email para activar tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Hemos enviado un correo de confirmación a tu dirección de email. Haz clic en el enlace para activar tu
              cuenta.
            </p>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">Volver al Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
