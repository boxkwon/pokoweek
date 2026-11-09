import Link from "next/link";

export default function NotFound() {
  return <div className="page-shell not-found"><div className="brand-ball big"><span/></div><h1>찾을 수 없는 페이지예요</h1><p>일정이 업데이트되면서 주소가 바뀌었을 수 있어요.</p><Link href="/">홈으로 돌아가기</Link></div>;
}
