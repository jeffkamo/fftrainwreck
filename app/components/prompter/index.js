import React, { Component, PropTypes } from 'react';
import {commands} from '../../constants'

import Battlefield from '../../containers/battlefield'

const Prompter = ({mode}) => {
    const prompts = {
        [commands.START]:  <p>What would you like to do?</p>,
        [commands.STORY]:  <p>Story time!</p>,
        [commands.COMBAT]: <Battlefield />,
    }

    return (
        <div>
            {prompts[mode]}
        </div>
    )
}

Prompter.propTypes = {
    mode: PropTypes.string,
}

export default Prompter
