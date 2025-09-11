import { ArrowLeft, Frown, House } from "lucide-react"
import { Link, useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const NotFound = () => {
  const router = useRouter()

  const handleGoBack = () => {
    router.history.back()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <div className="space-y-8">
        <Frown className="mx-auto size-24 text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            404 - Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground">
            Oops! The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
          <Button>
            <House />
            <Link to="/">Go to Home Page</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
