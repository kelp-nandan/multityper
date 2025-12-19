import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gamelobby } from './gamelobby';

describe('Gamelobby', () => {
  let component: Gamelobby;
  let fixture: ComponentFixture<Gamelobby>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gamelobby]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gamelobby);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
