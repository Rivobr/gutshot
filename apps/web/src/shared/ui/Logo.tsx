import { Link } from 'react-router-dom';

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link className={small ? 'logo logo--sm' : 'logo'} to="/">
      <img className="logo-img" src="/gutshot-logo.png" alt="GUTSHOT" />
    </Link>
  );
}
