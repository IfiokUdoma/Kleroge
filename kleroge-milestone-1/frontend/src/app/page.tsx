import { redirect } from 'next/navigation';

// The root "/" simply redirects. Actual home/search experience comes in Milestone 5.
export default function Home() {
  redirect('/auth/login');
}
