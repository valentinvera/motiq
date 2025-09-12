import {
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

interface WaitlistEmailProps {
  name: string
}

export const WaitlistEmail = ({ name }: WaitlistEmailProps) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2",
            format: "woff2",
          }}
          fontWeight="400, 500, 600, 700"
          fontStyle="normal"
        />
      </Head>
      <Preview>Thanks for joining the waitlist</Preview>
      <Tailwind>
        <body className="mx-auto my-auto bg-white" style={{ fontFamily: "Inter" }}>
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-gray-200 p-5">
            <Section className="mt-8">
              <Img
                src="https://motiq-ai.vercel.app/favicon.svg"
                width="40"
                height="40"
                alt="Motiq Logo"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-8 p-0 text-center text-2xl font-normal text-black">
              You're on the waitlist!
            </Heading>
            <Text className="text-sm leading-6 text-black">Hello {name},</Text>
            <Text className="text-sm leading-6 text-black">
              Thank you for signing up for the Motiq waitlist. I'm working hard to bring you the
              best AI-powered form builder, and I'm excited to have you on board.
            </Text>
            <Text className="text-sm leading-6 text-black">
              You'll be among the first to experience how Motiq makes creating, sharing, and
              analyzing forms easier.
            </Text>
            <Text className="text-sm leading-6 text-black">
              I'll notify you as soon as it's ready for you to join.
            </Text>
            <Section className="my-8 text-center">
              <Button
                href="https://motiq-ai.vercel.app"
                className="rounded-md bg-black px-5 py-3 text-center text-xs font-semibold text-white no-underline"
              >
                Visit Motiq
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">— Valen, Founder of Motiq</Text>
            <Hr className="my-6 w-full border border-solid border-gray-200" />
            <Link
              href="https://x.com/motiq_ai"
              className="block text-center text-xs text-gray-500 underline"
            >
              Twitter
            </Link>
          </Container>
        </body>
      </Tailwind>
    </Html>
  )
}
