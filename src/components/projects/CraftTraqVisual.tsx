import { ProductVisual } from './ProductVisual';

export function CraftTraqVisual() {
  return (
    <ProductVisual
      board={{
        src: '/crafttraq-board',
        width: 1902,
        height: 938,
        alt: "CraftTraq's Field Ops Console: a jobs board for Apex Plumbing with Created, In Progress, Complete, and Approved columns, each card showing a job ID, title, client, due date, and the initials of the assigned crew.",
      }}
      phone={{
        src: '/crafttraq-calendar',
        width: 375,
        height: 835,
        alt: "The same platform on a phone: CraftTraq's week calendar for July 27 to August 2, listing each day's scheduled tasks as colour-coded time blocks.",
      }}
    />
  );
}
