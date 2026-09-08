// GENERATED FILE — do not edit by hand.
// Run `node scripts/generate-skill-icons.mjs` to regenerate; the slug list and
// the reasoning behind each source live in that script.
//
// Same normalised shape as the Skills marks next door — a viewBox plus inner SVG
// painted with `currentColor` — so the Contact cards can hold every mark at the
// blueprint tint at rest and bloom one to `hex` on hover or focus.
import type { SkillMark } from './skillIcons';

export type ContactMarkSlug = 'email' | 'github' | 'linkedin' | 'crafttraq';

export const contactMarks: Record<ContactMarkSlug, SkillMark> = {
  email: {
    viewBox: '0 0 24 24',
    hex: '#5B8FF0',
    body:
      '<path fill="currentColor" d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zm-2 0l-8 5l-8-5zm0 12H4V8l8 5l8-5z"/>',
  },
  github: {
    viewBox: '0 0 32 32',
    hex: '#E6EDF3',
    body:
      '<path fill="currentColor" d="M16 .396c-8.839 0-16 7.167-16 16c0 7.073 4.584 13.068 10.937 15.183c.803.151 1.093-.344 1.093-.772c0-.38-.009-1.385-.015-2.719c-4.453.964-5.391-2.151-5.391-2.151c-.729-1.844-1.781-2.339-1.781-2.339c-1.448-.989.115-.968.115-.968c1.604.109 2.448 1.645 2.448 1.645c1.427 2.448 3.744 1.74 4.661 1.328c.14-1.031.557-1.74 1.011-2.135c-3.552-.401-7.287-1.776-7.287-7.907c0-1.751.62-3.177 1.645-4.297c-.177-.401-.719-2.031.141-4.235c0 0 1.339-.427 4.4 1.641a15.4 15.4 0 0 1 4-.541c1.36.009 2.719.187 4 .541c3.043-2.068 4.381-1.641 4.381-1.641c.859 2.204.317 3.833.161 4.235c1.015 1.12 1.635 2.547 1.635 4.297c0 6.145-3.74 7.5-7.296 7.891c.556.479 1.077 1.464 1.077 2.959c0 2.14-.02 3.864-.02 4.385c0 .416.28.916 1.104.755c6.4-2.093 10.979-8.093 10.979-15.156c0-8.833-7.161-16-16-16z"/>',
  },
  linkedin: {
    viewBox: '0 0 32 32',
    hex: '#1369BE',
    body:
      '<path fill="currentColor" d="M27.26 27.271h-4.733v-7.427c0-1.771-.037-4.047-2.475-4.047c-2.468 0-2.844 1.921-2.844 3.916v7.557h-4.739V11.999h4.552v2.083h.061c.636-1.203 2.183-2.468 4.491-2.468c4.801 0 5.692 3.161 5.692 7.271v8.385zM7.115 9.912a2.75 2.75 0 0 1-2.751-2.756a2.753 2.753 0 1 1 2.751 2.756m2.374 17.359H4.74V12h4.749zM29.636 0H2.36C1.057 0 0 1.031 0 2.307v27.387c0 1.276 1.057 2.307 2.36 2.307h27.271c1.301 0 2.369-1.031 2.369-2.307V2.307C32 1.031 30.932 0 29.631 0z"/>',
  },
  crafttraq: {
    viewBox: '0 0 512 512',
    hex: '#FC5B00',
    body:
      '<path fill="currentColor" d="M193 73H137a60 60 0 0 0-60 60v311a60 60 0 0 0 60 60h236a60 60 0 0 0 60-60V133a60 60 0 0 0-60-60h-56v24h56a36 36 0 0 1 36 36v311a36 36 0 0 1-36 36H137a36 36 0 0 1-36-36V133a36 36 0 0 1 36-36h56z"/><path fill="currentColor" fill-rule="evenodd" d="M194 45h10.7a52 52 0 0 1 100.6 0H316a24 24 0 0 1 24 24v42a24 24 0 0 1-24 24H194a24 24 0 0 1-24-24V69a24 24 0 0 1 24-24zM199 69h30.25a28 28 0 1 1 51.5 0H311a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6H199a6 6 0 0 1-6-6V75a6 6 0 0 1 6-6z"/><path fill="currentColor" d="M255 47a16 16 0 1 0 .1 0z"/><path fill="currentColor" d="M220 205h123v35h-55v89h-34v-89h-80a48 48 0 0 1 46-35z"/><path fill="currentColor" d="M170 272h37v55a39 39 0 0 0 39 39h64v38h-64a76 76 0 0 1-76-76z"/>',
  },
};
