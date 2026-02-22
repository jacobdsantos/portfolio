/**
 * DOCX export for the resume builder.
 *
 * EXPERIMENTAL: This module is behind a feature flag and may be removed
 * if bundle impact is too large. The preferred export path is print CSS
 * + html2pdf.js (see pdf.ts).
 *
 * Uses lazy-loaded `docx` library to generate a .docx file from the
 * ResumeRenderModel. Only imported when the user clicks "Export DOCX".
 */

import type { ResumeRenderModel, ResumeSection } from '../../../lib/resume/types';

/** Feature flag — set to false to disable DOCX export UI. */
export const DOCX_ENABLED = false;

/**
 * Generate a DOCX blob from a resume render model.
 *
 * Lazily imports the `docx` library only when called to avoid
 * bloating the main bundle.
 */
export async function generateDocx(renderModel: ResumeRenderModel): Promise<Blob> {
  // Lazy import — only loaded when user triggers export
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
    await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [];

  // Header
  children.push(
    new Paragraph({
      text: renderModel.header.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  );

  if (renderModel.header.label) {
    children.push(
      new Paragraph({
        text: renderModel.header.label,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
    );
  }

  // Contact line
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: renderModel.header.contactLines.join(' | '),
          size: 20,
          color: '555555',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  // Sections
  for (const section of renderModel.sections) {
    children.push(...renderDocxSection(section, { Paragraph, TextRun, HeadingLevel }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

function renderDocxSection(
  section: ResumeSection,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lib: { Paragraph: any; TextRun: any; HeadingLevel: any },
): InstanceType<typeof lib.Paragraph>[] {
  const { Paragraph, TextRun, HeadingLevel } = lib;
  const paragraphs: InstanceType<typeof Paragraph>[] = [];

  // Section heading
  paragraphs.push(
    new Paragraph({
      text: section.title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    }),
  );

  switch (section.type) {
    case 'summary':
      for (const block of section.blocks) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: block, size: 22 })],
            spacing: { after: 100 },
          }),
        );
      }
      break;

    case 'skills':
      for (const group of section.groups) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${group.group}: `, bold: true, size: 22 }),
              new TextRun({ text: group.items.join(', '), size: 22 }),
            ],
            spacing: { after: 60 },
          }),
        );
      }
      break;

    case 'experience':
      for (const item of section.items) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.role, bold: true, size: 22 }),
              new TextRun({ text: ` at ${item.company}`, size: 22 }),
              new TextRun({ text: `  |  ${item.dates}`, size: 20, color: '777777' }),
            ],
            spacing: { before: 150, after: 60 },
          }),
        );
        for (const bullet of item.bullets) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${bullet.text}`, size: 22 })],
              indent: { left: 360 },
              spacing: { after: 40 },
            }),
          );
        }
      }
      break;

    case 'projects':
      for (const item of section.items) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.name, bold: true, size: 22 }),
              new TextRun({ text: ` — ${item.summary}`, size: 20, italics: true }),
            ],
            spacing: { before: 100, after: 40 },
          }),
        );
        for (const bullet of item.bullets) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${bullet.text}`, size: 22 })],
              indent: { left: 360 },
              spacing: { after: 40 },
            }),
          );
        }
      }
      break;

    case 'education':
      for (const item of section.items) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.degree, bold: true, size: 22 }),
              new TextRun({ text: `, ${item.school}`, size: 22 }),
              new TextRun({ text: `  (${item.date})`, size: 20, color: '777777' }),
            ],
            spacing: { after: 60 },
          }),
        );
      }
      break;

    case 'certifications':
      for (const item of section.items) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.name, bold: true, size: 22 }),
              new TextRun({ text: ` — ${item.issuer}, ${item.date}`, size: 20 }),
            ],
            spacing: { after: 40 },
          }),
        );
      }
      break;

    case 'publications':
      for (const item of section.items) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `"${item.title}"`, size: 22 }),
              new TextRun({ text: ` — ${item.publisher}, ${item.date}`, size: 20, color: '555555' }),
            ],
            spacing: { after: 40 },
          }),
        );
      }
      break;
  }

  return paragraphs;
}

/**
 * Trigger a DOCX download in the browser.
 */
export async function downloadDocx(renderModel: ResumeRenderModel, filename = 'resume.docx'): Promise<void> {
  const blob = await generateDocx(renderModel);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
