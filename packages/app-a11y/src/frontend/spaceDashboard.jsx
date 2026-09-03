import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  BarChart, Box, Button, Heading, Inline, Lozenge, SectionMessage, Spinner, Stack, Text,
  DynamicTable, useProductContext,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { CountsRow, SeverityTag, scoreAppearance } from './shared.jsx';

const POLL_MS = 4000;

const App = () => {
  const context = useProductContext();
  const spaceKey = context?.extension?.space?.key;
  const [data, setData] = useState({ loading: true });
  const [pages, setPages] = useState([]);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    const [report, pageList] = await Promise.all([
      invoke('spaceReport', { spaceKey }),
      invoke('spacePages', { spaceKey, limit: 50 }),
    ]);
    setData({ loading: false, ...report });
    setPages(pageList);
  }, [spaceKey]);

  useEffect(() => { load(); }, [load]);

  // Keep polling while a scan is walking through the space.
  useEffect(() => {
    if (!data?.progress || data.progress.done) return undefined;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [data?.progress, load]);

  const startScan = useCallback(async () => {
    setStarting(true);
    setNotice(null);
    try {
      const res = await invoke('startSpaceScan', { spaceKey });
      if (!res.started) {
        setNotice(res.reason === 'unlicensed'
          ? 'Scanning a whole space needs an active subscription. Single-page checks stay available.'
          : 'The scan could not be started.');
      } else {
        await load();
      }
    } finally {
      setStarting(false);
    }
  }, [spaceKey, load]);

  const publish = useCallback(async () => {
    const res = await invoke('publishReportPage', { spaceKey });
    setNotice(res.ok ? 'The conformance report has been created as a page in this space.' : 'The report page could not be created.');
  }, [spaceKey]);

  if (data.loading) return <Inline space="space.100" alignBlock="center"><Spinner /><Text>Loading…</Text></Inline>;

  const report = data.report;
  const progress = data.progress;
  const scanning = progress && !progress.done;

  return (
    <Stack space="space.300">
      <Inline space="space.200" alignBlock="center" spread="space-between">
        <Heading as="h1">{`Accessibility — ${spaceKey ?? ''}`}</Heading>
        <Inline space="space.100">
          <Button appearance="primary" onClick={startScan} isDisabled={starting || scanning}>
            {scanning ? 'Scanning…' : report ? 'Re-scan space' : 'Scan this space'}
          </Button>
          {report ? <Button onClick={publish}>Publish report page</Button> : null}
        </Inline>
      </Inline>

      {notice ? <SectionMessage appearance="information"><Text>{notice}</Text></SectionMessage> : null}

      {scanning ? (
        <SectionMessage appearance="information" title="Scan in progress">
          <Text>{`${progress.scanned} pages checked so far. This page updates itself as the scan runs.`}</Text>
        </SectionMessage>
      ) : null}

      {!report ? (
        <SectionMessage appearance="information" title="This space has not been scanned yet">
          <Text>Run a scan to see how the space measures against WCAG 2.2 level AA, which pages fail, and what to fix first.</Text>
        </SectionMessage>
      ) : (
        <Stack space="space.300">
          <Inline space="space.300" shouldWrap>
            <Stack space="space.050">
              <Text appearance="subtle">Average page score</Text>
              <Heading as="h2">{`${report.averageScore}/100`}</Heading>
            </Stack>
            <Stack space="space.050">
              <Text appearance="subtle">Pages with no A/AA failure</Text>
              <Heading as="h2">{`${report.conformantPages} of ${report.pages}`}</Heading>
            </Stack>
            <Stack space="space.050">
              <Text appearance="subtle">Last scan</Text>
              <Text>{new Date(report.generatedAt).toLocaleString()}</Text>
            </Stack>
          </Inline>

          <CountsRow counts={report.counts} />

          <Stack space="space.100">
            <Heading as="h3">Most common problems</Heading>
            <BarChart
              data={report.byRule.slice(0, 8).map((r) => [r.title, r.issues])}
              xAccessor={0}
              yAccessor={1}
              colorAccessor={0}
            />
          </Stack>

          <Stack space="space.100">
            <Heading as="h3">Findings by check</Heading>
            <DynamicTable
              head={{ cells: [
                { key: 'rule', content: 'Check' },
                { key: 'sev', content: 'Severity' },
                { key: 'pages', content: 'Pages' },
                { key: 'issues', content: 'Occurrences' },
              ] }}
              rows={report.byRule.map((r) => ({
                key: r.ruleId,
                cells: [
                  { key: 'rule', content: <Text>{r.title}</Text> },
                  { key: 'sev', content: <SeverityTag severity={r.severity} /> },
                  { key: 'pages', content: <Text>{String(r.pages)}</Text> },
                  { key: 'issues', content: <Text>{String(r.issues)}</Text> },
                ],
              }))}
              rowsPerPage={10}
            />
          </Stack>

          <Stack space="space.100">
            <Heading as="h3">Pages needing attention first</Heading>
            <DynamicTable
              head={{ cells: [
                { key: 'title', content: 'Page' },
                { key: 'score', content: 'Score' },
                { key: 'critical', content: 'Critical' },
                { key: 'serious', content: 'Serious' },
              ] }}
              rows={pages.slice(0, 25).map((p) => ({
                key: p.pageId,
                cells: [
                  { key: 'title', content: <Text>{p.title}</Text> },
                  { key: 'score', content: <Lozenge appearance={scoreAppearance(p.score)}>{String(p.score)}</Lozenge> },
                  { key: 'critical', content: <Text>{String(p.counts?.critical ?? 0)}</Text> },
                  { key: 'serious', content: <Text>{String(p.counts?.serious ?? 0)}</Text> },
                ],
              }))}
              rowsPerPage={10}
            />
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);
