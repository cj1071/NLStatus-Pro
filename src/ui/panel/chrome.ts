import { Storage } from '../../utils/storage';

const DRAG_THRESHOLD = 5;

interface DragStartStyles {
  left: string;
  right: string;
  top: string;
}

interface PanelPosition {
  anchorX?: number;
  alignRight?: boolean;
  topRatio?: number;
}

interface PanelChromeOptions {
  el: HTMLElement;
  storage: Storage;
}

export class PanelChrome {
  private _collapsed = false;
  private _dragging = false;
  private _moved = false;
  private _ox = 0;
  private _oy = 0;
  private _sx = 0;
  private _sy = 0;
  private _dragStartStyles: DragStartStyles | null = null;
  private _onDragMove: EventListener;
  private _onDragEnd: () => void;
  private _onTouchEnd: () => void;
  private _handleHeaderMouseDown: EventListener;
  private _handlePanelMouseDown: EventListener;
  private _handleHeaderTouchStart: EventListener;
  private _handlePanelTouchStart: EventListener;

  constructor(private _options: PanelChromeOptions) {
    this._onDragMove = (e) => this._updateDrag(e as MouseEvent | TouchEvent);
    this._onDragEnd = () => this._endDrag();
    this._onTouchEnd = () => this._handleTouchEnd();
    this._handleHeaderMouseDown = (e) => {
      if (!this._el.classList.contains('nle-collapsed')) this._startDrag(e as MouseEvent);
    };
    this._handlePanelMouseDown = (e) => {
      if (this._el.classList.contains('nle-collapsed')) this._startDrag(e as MouseEvent);
    };
    this._handleHeaderTouchStart = (e) => {
      if (!this._el.classList.contains('nle-collapsed')) this._startDrag(e as TouchEvent);
    };
    this._handlePanelTouchStart = (e) => {
      if (this._el.classList.contains('nle-collapsed')) this._startDrag(e as TouchEvent);
    };
  }

  init(): void {
    const header = this._el.querySelector('.nle-hdr')!;
    header.addEventListener('mousedown', this._handleHeaderMouseDown);
    this._el.addEventListener('mousedown', this._handlePanelMouseDown);
    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);

    header.addEventListener('touchstart', this._handleHeaderTouchStart, { passive: false });
    this._el.addEventListener('touchstart', this._handlePanelTouchStart, { passive: false });
    document.addEventListener('touchmove', this._onDragMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd);
    document.addEventListener('touchcancel', this._onTouchEnd);
  }

  toggleCollapse(initCollapsed = false): void {
    if (!initCollapsed) this._collapsed = !this._collapsed;
    else this._collapsed = true;

    this._el.classList.add('no-trans');
    this._el.classList.toggle('nle-collapsed', this._collapsed);
    this._options.storage.set('nle_collapsed', this._collapsed);

    if (!this._collapsed) this.applyMaxHeight();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._el.classList.remove('no-trans');
      });
    });
  }

  applyMaxHeight(): void {
    if (this._el.classList.contains('nle-collapsed')) return;
    const margin = 12;
    const top = this._el.getBoundingClientRect().top;
    const available = window.innerHeight - top - margin;
    const cap = Math.round(window.innerHeight * 0.6);
    const maxH = Math.max(120, Math.min(available, cap));
    this._el.style.maxHeight = `${maxH}px`;
  }

  restorePosition(): void {
    const pos = this._options.storage.get('nle_panelPosition', null) as PanelPosition | null;
    if (!pos) {
      this.applyMaxHeight();
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const isCollapsed = this._el.classList.contains('nle-collapsed');
    const panelWidth = isCollapsed ? 48 : this._el.offsetWidth;
    const panelHeight = isCollapsed ? 48 : this._el.offsetHeight;

    let anchorX = pos.anchorX || 16;
    const alignRight = pos.alignRight !== false;

    const maxX = Math.max(margin, vw - panelWidth - margin);
    anchorX = Math.max(margin, Math.min(anchorX, maxX));

    if (pos.topRatio !== undefined) {
      const maxTop = Math.max(margin, vh - panelHeight - margin);
      this._el.style.top = `${Math.max(margin, Math.min(Math.round(pos.topRatio * vh), maxTop))}px`;
    }

    if (alignRight) {
      this._el.style.right = `${anchorX}px`;
      this._el.style.left = 'auto';
    } else {
      this._el.style.left = `${anchorX}px`;
      this._el.style.right = 'auto';
    }

    this.applyMaxHeight();
  }

  destroy(): void {
    const header = this._el.querySelector('.nle-hdr');
    header?.removeEventListener('mousedown', this._handleHeaderMouseDown);
    this._el.removeEventListener('mousedown', this._handlePanelMouseDown);
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);

    header?.removeEventListener('touchstart', this._handleHeaderTouchStart);
    this._el.removeEventListener('touchstart', this._handlePanelTouchStart);
    document.removeEventListener('touchmove', this._onDragMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    document.removeEventListener('touchcancel', this._onTouchEnd);
  }

  private get _el(): HTMLElement {
    return this._options.el;
  }

  private _handleTouchEnd(): void {
    const wasDragging = this._dragging;
    const isCollapsed = this._el.classList.contains('nle-collapsed');
    this._endDrag();
    if (wasDragging && !this._moved && isCollapsed) this.toggleCollapse();
    if (isCollapsed && wasDragging) {
      this._el.classList.add('no-hover-effect');
      setTimeout(() => this._el.classList.remove('no-hover-effect'), 50);
    }
  }

  private _startDrag(e: MouseEvent | TouchEvent): void {
    const isCollapsed = this._el.classList.contains('nle-collapsed');
    if (!isCollapsed && ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.nle-tab'))) return;

    const p = this._getPointer(e);
    this._dragging = true;
    this._moved = false;

    const rect = this._el.getBoundingClientRect();
    this._dragStartStyles = {
      left: this._el.style.left,
      right: this._el.style.right,
      top: this._el.style.top,
    };

    this._el.classList.add('no-trans');
    this._el.style.left = `${rect.left}px`;
    this._el.style.right = 'auto';
    this._ox = p.x - rect.left;
    this._oy = p.y - rect.top;
    this._sx = p.x;
    this._sy = p.y;
    e.preventDefault();
  }

  private _updateDrag(e: MouseEvent | TouchEvent): void {
    if (!this._dragging) return;

    const p = this._getPointer(e);
    if (Math.abs(p.x - this._sx) > DRAG_THRESHOLD || Math.abs(p.y - this._sy) > DRAG_THRESHOLD) {
      this._moved = true;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const w = this._el.offsetWidth;
    const h = this._el.offsetHeight;
    const maxLeft = Math.max(margin, vw - w - margin);
    const maxTop = Math.max(margin, vh - h - margin);

    this._el.style.left = `${Math.max(margin, Math.min(p.x - this._ox, maxLeft))}px`;
    this._el.style.top = `${Math.max(margin, Math.min(p.y - this._oy, maxTop))}px`;
    this.applyMaxHeight();
  }

  private _endDrag(): void {
    if (!this._dragging) return;
    this._dragging = false;
    this._el.classList.remove('no-trans');

    if (!this._moved) {
      if (this._dragStartStyles) {
        this._el.style.left = this._dragStartStyles.left;
        this._el.style.right = this._dragStartStyles.right;
        this._el.style.top = this._dragStartStyles.top;
      }
      this._dragStartStyles = null;
      return;
    }
    this._dragStartStyles = null;

    const rect = this._el.getBoundingClientRect();
    const vw = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    const alignRight = centerX > vw / 2;

    if (alignRight) {
      this._el.style.right = `${Math.round(vw - rect.right)}px`;
      this._el.style.left = 'auto';
    }
    this.applyMaxHeight();
    this._savePosition();
  }

  private _savePosition(): void {
    const rect = this._el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = rect.left + rect.width / 2;
    const alignRight = centerX > vw / 2;

    const anchorX = alignRight
      ? Math.round(parseFloat(this._el.style.right) || vw - rect.right)
      : Math.round(parseFloat(this._el.style.left) || rect.left);

    this._options.storage.set('nle_panelPosition', {
      topRatio: vh > 0 ? Math.max(0, Math.min(1, rect.top / vh)) : 0,
      anchorX,
      alignRight,
    });
  }

  private _getPointer(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const tev = e as TouchEvent;
    if (tev.touches) return { x: tev.touches[0].clientX, y: tev.touches[0].clientY };
    const mev = e as MouseEvent;
    return { x: mev.clientX, y: mev.clientY };
  }
}
