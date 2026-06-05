import { notFound } from 'next/navigation';

import { fetchServiceById, JPYC_POLYGON, POLYGON_NETWORK } from '@/lib/registry';
import { formatJpyc, shortAddr, resourcePath, payableUrl, buyerPrompt } from '@/lib/format';
import { getSignals } from '@/lib/signals';
import { CopyButton } from '@/app/_components/CopyButton';

export const dynamic = 'force-dynamic';

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await fetchServiceById(id);
  if (!s) notFound();

  const accept =
    s.accepts.find(a => a.network === POLYGON_NETWORK && a.asset?.toLowerCase() === JPYC_POLYGON) ??
    s.accepts[0];
  const signals = accept?.payTo ? await getSignals(accept.payTo) : null;
  const inv = s['x-jp402']?.invoice;

  const method = s.method ?? 'GET';
  const payable = payableUrl(s.resource, s.parameters);
  const prompt = buyerPrompt({
    method,
    url: payable,
    priceJpyc: formatJpyc(accept?.maxAmountRequired),
    payTo: accept?.payTo,
    publisher: s.publisher,
  });

  return (
    <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <p style={{ marginBottom: 8 }}><a href="/">← 一覧へ</a></p>
      <p className="kicker">リソース詳細</p>
      <div className="ep-head">
        <span className={`method method-${method.toLowerCase()}`}>{method}</span>
        <span className="path mono">{resourcePath(s.resource)}</span>
      </div>
      <div className="ep-meta">
        <span className="pub">{s.publisher}</span>
        {(s.tags ?? []).map(t => <span key={t} className="tag">{t}</span>)}
        {inv?.registrationNumber
          ? <span className="chip ok">適格請求書あり</span>
          : <span className="chip">免税/未登録</span>}
      </div>
      {s.description && <p style={{ margin: '8px 0', lineHeight: 1.7 }}>{s.description}</p>}
      <div className="ep-url">
        <span className="mono ep-url-text">{payable}</span>
        <CopyButton text={prompt} title="エージェント用プロンプトをコピー" />
      </div>

      <div className="list" style={{ marginTop: 24 }}>
        <div className="svc" style={{ display: 'block' }}>
          <Row label="価格" value={formatJpyc(accept?.maxAmountRequired)} mono />
          <Row label="チェーン" value="Polygon (eip155:137)" />
          <Row label="トークン" value={`JPYC ${shortAddr(accept?.asset)}`} mono />
          <Row label="受取先 (payTo)" value={shortAddr(accept?.payTo)} mono />
          <Row label="scheme" value={accept?.scheme ?? '—'} />
          <Row
            label="適格請求書"
            value={inv?.registrationNumber ? `${inv.registrationNumber}（要実在検証）` : '免税/未登録'}
          />
        </div>

        <div className="svc" style={{ display: 'block' }}>
          <div className="kicker" style={{ marginBottom: 8 }}>信頼シグナル（透明・載る≠信頼）</div>
          {signals?.measured ? (
            <>
              <Row label="累計着金額" value={formatJpyc(signals.volumeRaw ?? undefined)} mono />
              <Row
                label="着金 tx 数"
                value={`${signals.txCount}${signals.capped ? '+（上限到達）' : ''}`}
                mono
              />
              <Row label="ユニーク送金元" value={String(signals.uniqueWallets)} mono />
            </>
          ) : (
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              未計測（ALCHEMY_POLYGON_URL 設定後に JPYC 着金実績を表示。P5 で実装）。
              ゼロ実績は隠さず明示する方針。
            </p>
          )}
        </div>
      </div>

      <p style={{ marginTop: 24 }}>
        <a className="btn primary" href={s.resource} target="_blank" rel="noopener">リソースを開く →</a>
      </p>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <strong className={mono ? 'mono' : undefined} style={{ textAlign: 'right', wordBreak: 'break-all' }}>{value}</strong>
    </div>
  );
}
