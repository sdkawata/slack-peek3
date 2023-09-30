import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, unseal } from "./session";
import {WebClient} from '@slack/web-api'

type Channel = {
  id: string;
  name: string;
  is_channel: boolean;
}

type ChannelHistoryResponse = {
  messages: {user: string, text: string, ts: string}[]
}

const tsToNumber = (ts:string) => parseInt(ts.split(".")[0], 10)


export default async function Home() {
  const {token} = await unseal(cookies().get(SESSION_COOKIE_NAME)!.value)
  const web = new WebClient(token)
  const channels: Channel[] = []
  for await (const page of web.paginate('conversations.list')) {
    channels.push(...(page.channels as Channel[]))
  }
  const targetChannels = channels.filter(channel => channel.is_channel && /times_/.test(channel.name))
  const historyResponses = await Promise.all(targetChannels.map(channel => web.conversations.history({channel: channel.id}))) as ChannelHistoryResponse[]
  const messages = historyResponses.flatMap(response => response.messages).sort((message1, message2) => tsToNumber(message1.ts) - tsToNumber(message2.ts))
  return (
    <main>
      main page!!!
      {messages.map((message) => <div>{message.text}</div>)}
    </main>
  )
}
