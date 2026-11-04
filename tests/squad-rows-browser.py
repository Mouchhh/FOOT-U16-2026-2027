from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1366, 'height': 900}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.wait_for_function('window.squadProfileFields && window.documentEntry')
    page.evaluate("""() => squadSave([
      {id:'row-a',name:'Alex Martin',number:9,photo:'',position:'Attaquant',primaryCategory:'U17',availability:'Disponible'},
      {id:'row-b',name:'Noé Petit',number:8,photo:'',position:'Milieu',primaryCategory:'U15',availability:'Indisponible'}
    ])""")
    page.locator('#workspace-squad-entry').click()
    rows = page.locator('.squad-card[data-player-id]')
    assert rows.count() == 2
    first, second = rows.nth(0), rows.nth(1)
    a, b = first.bounding_box(), second.bounding_box()
    assert abs(a['x'] - b['x']) < 1 and abs(a['width'] - b['width']) < 1
    assert b['y'] >= a['y'] + a['height'] + 14
    assert a['width'] > a['height'] * 2
    assert first.locator('.roster-avatar').bounding_box()['x'] < first.locator('.squad-player-info').bounding_box()['x']
    assert first.locator('.squad-primary-category').inner_text() == 'U17'
    assert first.locator('.squad-availability').inner_text() == 'Disponible'
    assert first.locator('.player-stat-badges > .player-stat-metric').count() == 4
    assert first.locator('.squad-card-number').count() == 0
    first.locator('.player-stat-profile-link').click()
    assert page.locator('#player-stats-dialog').is_visible()
    page.locator('#player-stats-dialog .external-modal-close').click()
    for width in [1024, 768, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), width
        a, b = first.bounding_box(), second.bounding_box()
        assert b['y'] > a['y'] + a['height']
        assert first.locator('.squad-availability').is_visible()
        first.locator('.player-stat-manage summary').click()
        assert first.get_by_role('button', name='Modifier Alex Martin', exact=True).is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), width
        first.locator('.player-stat-manage summary').click()
    assert not errors, errors
    browser.close()
print('Airy player rows, identity/category/status, four retained metrics, profile access, management and responsive widths passed')
