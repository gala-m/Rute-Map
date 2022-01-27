import * as React from 'react'
import { render } from 'preact';

import Content from './components/main'
import SwipeableTemporaryDrawer from './components/drawer';

const mobile = window.matchMedia( "(max-width: 600px)" );

const App = () => {
    if (mobile.matches) {
        return (
            <div>
                
                <SwipeableTemporaryDrawer/>
            </div>
        )
    } else {
        return <Content />
    }
}



render(<App />, document.getElementById('app'));