import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, unseal } from "./session";
import {WebClient} from '@slack/web-api'
import dayjs from 'dayjs'
import { strToColor } from './color';

type Channel = {
  id: string;
  name: string;
  is_channel: boolean;
}

type User = {
  id: string,
  name: string,
  team: string,
}

type Message = {
  user: string | undefined;
  bot_id: string | undefined;
  username: string | undefined;
  text: string;
  ts: string;
}

type SlackMessage = {
  channelId:string,
  channelName: string,
  userId: string,
  userName: string,
  permalink: string,
  teamId: string,
  text: string,
  ts: string,
}

type SearchMessagesResponse = {
  messages: {
    
    matches: {
      channel: {
        id: string,
        name: string,
      },
      team:string, 
      permalink: string,
      text: string,
      ts: string,
      user: string,
      username: string,
    }[]
  }
}

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
  const messages = searchResponse.messages.matches.map(match => ({
    channelId: match.channel.id,
    channelName: match.channel.name,
    userId: match.user,
    userName: match.username,
    teamId: match.team,
    text: match.text,
    ts: match.ts,
    permalink: match.permalink,
  } as SlackMessage))
  return {
    messages,
    users,
    channels,
  }
}


function regexMultiReplace(text: string, replaces: [RegExp, (re:RegExpMatchArray) => string][]) {
  replaces.forEach((m) => {if (! m[0].global){throw new Error('all regex must have global flag!!!')}})
  const rec = (s:string, p:number): string => {
    //console.log(s,p)
    if (replaces.length <= p) {
      return s
    }
    let results = []
    const [re, f] = replaces[p]
    re.lastIndex = 0
    let last = 0
    while(true) {
      const m = re.exec(s)
      if (m=== null) {
        break;
      }
      results.push(rec(s.slice(last, m.index), p+1))
      results.push(f(m))
      last = re.lastIndex
    }
    results.push(rec(s.slice(last), p+1))
    return results.join('')
  }
  return rec(text, 0)
}

function toHTML(text: string, users: User[]) {
  return regexMultiReplace(text, [
    [/<(https?:\/\/[^>|]+)\|([^>]+)>/g, (m) => `<a href=${m[1]}>${m[2]}</a>`],
    [/<(https?:\/\/[^>|]+)>/g, (m) => `<a href=${m[1]}>${m[1]}</a>`],
    [/<@([0-9A-Za-z]+)>/g, (m) => {const user = users.find((user) => user.id === m[1]); return user ? `<@${user.name}>` : m[0]}],
    [/\r?\n/g, (m) => '<br>'],
    [/<|>/g, (m) => ({'<': '&lt;', '>': '&gt'}[m[0]]!)],
    // [/<|>|&|"/g, (m) => ({'<': '&lt;', '>': '&gt', '&': '&amp;', '"': '&quot;'}[m[0]])],
  ])
}

function formatTs(message: SlackMessage) {
  return dayjs.unix(parseInt(message.ts.split('.')[0])).format('YYYY-MM-DD HH:mm:ss')
}

const Message: React.FC<{message: SlackMessage, users: User[], channels: Channel[]}> = ({message, users, channels}) => {
  const time = dayjs.unix(parseInt(message.ts.split('.')[0])).format('YYYY-MM-DD HH:mm:ss')
  const userId = message.userId
  const userName = message.userName
  const channelId = message.channelId
  const channelName = message.channelName
  let link = `slack://channel?team=${message.teamId}&id=${message.channelId}&message=${message.ts}`
  const match = message.permalink.match(/thread_ts=([0-9.]+)/)
  if (match !== null) {
    link += `&thread_ts=${match[1]}`
  }
  return (<div className="odd:bg-slate-100">
  <span className="font-bold" style={{color: strToColor('ch', channelId)}}>{channelName}</span>:
  <span className="font-bold" style={{color: strToColor('un', userId)}}>{userName}</span>:
  <span dangerouslySetInnerHTML={{__html: toHTML(message.text, users)}}/>
  <a className="text-xs text-slate-500 ml-2" href={link}>{time}</a>
</div>)
}

export default async function Home() {
  const {channels, users, messages} = await fetchMessage()
  return (
    <main>
      {messages.map((message) => <Message message={message} users={users} channels={channels} key={`${message.channelId}:${message.ts}`}/>)}
    </main>
  )
}
