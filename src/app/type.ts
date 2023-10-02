export type SlackMessage = {
  channelId:string,
  channelName: string,
  userId: string,
  userName: string,
  permalink: string,
  teamId: string,
  text: string,
  ts: string,
}

export type Channel = {
  id: string;
  name: string;
  is_channel: boolean;
}

export type User = {
  id: string,
  name: string,
  team: string,
}

export type Message = {
  user: string | undefined;
  bot_id: string | undefined;
  username: string | undefined;
  text: string;
  ts: string;
}


export type SearchMessagesResponse = {
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