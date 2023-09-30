import { sealData, unsealData } from "iron-session/edge";

export const SESSION_COOKIE_NAME = 'slack_peek3_session';
export type Session = {
    token: string;
}

export const seal = (session: Session) => sealData(session, {password: process.env.SESSION_PASSWORD!})
export const unseal = (cookie: string) => unsealData<Session>(cookie, {password: process.env.SESSION_PASSWORD!})