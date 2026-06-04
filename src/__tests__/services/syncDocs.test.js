import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { syncCourse } from '../../../scripts/sync-docs.js';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('{}'),
    writeFileSync: vi.fn(),
  }
}));

// Helper builders for Google Docs structure
function mockTextRun(text) {
  return {
    textRun: {
      content: text,
      textStyle: {}
    }
  };
}

function mockParagraph(text, styleType = 'NORMAL_TEXT') {
  return {
    paragraph: {
      elements: [mockTextRun(text)],
      paragraphStyle: {
        namedStyleType: styleType
      }
    }
  };
}

function mockTableCell(text) {
  return {
    content: [mockParagraph(text)]
  };
}

function mockTableRow(cells) {
  return {
    tableCells: cells.map(mockTableCell)
  };
}

function mockTable(rows) {
  return {
    table: {
      columns: rows[0]?.length || 0,
      rows: rows.length,
      tableRows: rows.map(mockTableRow)
    }
  };
}

describe('sync-docs syncCourse', () => {
  let mockDocs;
  let logSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockDocs = {
      documents: {
        get: vi.fn()
      }
    };
  });

  it('should skip sync and log warning if course status is Draft', async () => {
    const docData = {
      body: {
        content: [
          mockParagraph('# [Config]', 'HEADING_1'),
          mockTable([
            ['course_id:', 'agv-101'],
            ['status:', 'Draft']
          ])
        ]
      }
    };

    mockDocs.documents.get.mockResolvedValue({ data: docData });

    await syncCourse(mockDocs, 'doc-123', 'agentic-engineering', 'agv-101');

    // Should not write files
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Course [agv-101] is a draft; skipping sync');
  });

  it('should parse single-doc (tabless) structures successfully', async () => {
    const docData = {
      body: {
        content: [
          mockParagraph('# [Config]', 'HEADING_1'),
          mockTable([
            ['course_id:', 'agv-101'],
            ['title:', 'Agentic Engineering 101'],
            ['version:', '1.0.0'],
            ['author:', 'Taylor'],
            ['status:', 'Published']
          ]),
          mockParagraph('# [Intro]', 'HEADING_1'),
          mockParagraph('This is the intro description.'),
          mockTable([
            ['🚀', 'Feature Title\nFeature Desc']
          ]),
          mockParagraph('# [01-Course Introduction]', 'HEADING_1'),
          mockParagraph('Welcome to the course!')
        ]
      }
    };

    mockDocs.documents.get.mockResolvedValue({ data: docData });

    // Mock existsSync to return false for target file so it writes it
    fs.existsSync.mockReturnValue(false);

    await syncCourse(mockDocs, 'doc-123', 'agentic-engineering', 'agv-101');

    // Should write metadata.json, manifest.json, modules, and track.json
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalledWith('Course [agv-101] is a draft; skipping sync');

    // Find write metadata call
    const metadataWrite = fs.writeFileSync.mock.calls.find(call => call[0].includes('metadata.json'));
    expect(metadataWrite).toBeDefined();
    const metadata = JSON.parse(metadataWrite[1]);
    expect(metadata.course_id).toBe('agv-101');
    expect(metadata.title).toBe('Agentic Engineering 101');
    expect(metadata.author).toBe('Taylor');
    expect(metadata.description).toBe('This is the intro description.');

    // Find module write call
    const moduleWrite = fs.writeFileSync.mock.calls.find(call => call[0].includes('01-course-introduction.json'));
    expect(moduleWrite).toBeDefined();
    const moduleObj = JSON.parse(moduleWrite[1]);
    expect(moduleObj.title).toBe('01-Course Introduction');
    expect(moduleObj.blocks[0].content).toBe('Welcome to the course!');
  });
});
