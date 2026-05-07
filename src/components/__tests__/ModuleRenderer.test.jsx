import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ModuleRenderer from '../ModuleRenderer';

// Mock the sub-components to test selection logic
vi.mock('../LabModule', () => ({
  default: () => <div data-testid="lab-module">Lab Module</div>
}));
vi.mock('../PresentationModule', () => ({
  default: () => <div data-testid="presentation-module">Presentation Module</div>
}));
vi.mock('../ResourceModule', () => ({
  default: () => <div data-testid="resource-module">Resource Module</div>
}));

describe('ModuleRenderer', () => {
  it('renders LabModule by default or when type is lab', () => {
    const labModule = { type: 'lab', blocks: [] };
    render(<ModuleRenderer module={labModule} />);
    expect(screen.getByTestId('lab-module')).toBeInTheDocument();

    const noTypeModule = { blocks: [] };
    render(<ModuleRenderer module={noTypeModule} />);
    expect(screen.getAllByTestId('lab-module').length).toBe(2);
  });

  it('renders PresentationModule when type is presentation', () => {
    const presentationModule = { type: 'presentation', blocks: [] };
    render(<ModuleRenderer module={presentationModule} />);
    expect(screen.getByTestId('presentation-module')).toBeInTheDocument();
  });

  it('renders ResourceModule when type is resource', () => {
    const resourceModule = { type: 'resource', blocks: [] };
    render(<ModuleRenderer module={resourceModule} />);
    expect(screen.getByTestId('resource-module')).toBeInTheDocument();
  });
});
