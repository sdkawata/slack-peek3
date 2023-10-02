
import dayjs from 'dayjs'
import { strToColor } from './color';
import { Channel, SlackMessage, User } from './type';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

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
      // results.push(rec(s.slice(last, m.index), p+1))
      // results.push(f(m))
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

export const Message: React.FC<{message: SlackMessage, users: User[], channels: Channel[]}> = ({message, users, channels}) => {
  const time = dayjs.unix(parseInt(message.ts.split('.')[0])).tz().format('YYYY-MM-DD HH:mm:ss')
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