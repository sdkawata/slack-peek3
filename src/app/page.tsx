import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, unseal } from "./session";
import {WebClient} from '@slack/web-api'
import { Message } from './Message';
import { Channel, SearchMessagesResponse, SlackMessage, User } from './type';
import { Suspense } from 'react';

const fetchMessage = async () => {
  const {token} = await unseal(cookies().get(SESSION_COOKIE_NAME)!.value)
  const web = new WebClient(token)
  const channels: Channel[] = []
  for await (const page of web.paginate('conversations.list', {
    exclude_archived: true,
  })) {
    channels.push(...(page.channels as Channel[]))
  }
  const users: User[] = []
  for await (const page of web.paginate('users.list')) {
     users.push(...(page.members as User[]))
  }
  const targetChannels = channels.filter(channel => channel.is_channel && /^times/.test(channel.name))
  const query = targetChannels.map(channel => `in:${channel.name}`).join(" OR ")
  const searchResponse = (await web.search.messages({query, count: 100, sort: 'timestamp', sort_dir: 'desc'})) as unknown as SearchMessagesResponse
  
  const messages = searchResponse.messages.matches.map(match => {
    const text = (match.text === '' || match.text === null) && match.attachments && match.attachments[0].fallback ? match.attachments[0].fallback : match.text;
    return {
      channelId: match.channel.id,
      channelName: match.channel.name,
      userId: match.user,
      userName: match.username,
      teamId: match.team,
      text: text,
      ts: match.ts,
      permalink: match.permalink,
    } as SlackMessage
  })
  return {
    messages,
    users,
    channels,
  }
}

async function HomeContent() {
  const {channels, users, messages} = await fetchMessage()
  return (
    <main>
      {messages.map((message) => <Message message={message} users={users} channels={channels} key={`${message.channelId}:${message.ts}`}/>)}
    </main>
  )
}

export default function Home() {
  return <Suspense fallback={<>loading...</>}><HomeContent/></Suspense>
}
