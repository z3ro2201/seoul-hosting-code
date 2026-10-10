import { Link, useParams } from "react-router";

interface Props {
  title: string;
  description?: string;
  backTo?: string;
}

/** API나 실제 디자인을 연결하기 전까지 사용할 페이지 틀 */
export default function RoutePlaceholder({ title, description, backTo }: Props) {
  const { id } = useParams();
  return (
    <section>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {id && <p>학교/문서 ID: {id}</p>}
      {backTo && <p><Link to={backTo}>목록으로 돌아가기</Link></p>}
    </section>
  );
}
