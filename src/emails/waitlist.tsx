import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components"

interface WaitlistEmailProps {
  name: string
}

export const WaitlistEmail = ({ name }: WaitlistEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You're on the waitlist!</Preview>
      <Tailwind>
        <body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              You're on the waitlist, {name}!
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Thanks for signing up! We'll let you know as soon as Motiq is ready for you.
            </Text>
            <Button
              href="https://motiq-ai.vercel.app"
              className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
            >
              Visit our site
            </Button>
          </Container>
        </body>
      </Tailwind>
    </Html>
  )
}
