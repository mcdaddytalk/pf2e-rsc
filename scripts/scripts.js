// This function is run on the player's end, by the owner(s) of the token selected by the
// GM when the gm_skillset macro was run.
//
// You can roll each attempt one-by-one, or you can select "Autoroll" to have the script
// loop until you either achieve the required number of successes, or you critically fail
// 
// You can also combine these i.e. do a few attempts and then decide to "Autoroll" until
// completion.
//
// The 'specific bonuses' are for skill modifiers that apply only to that specific check e.g. the
// lockpicking bonus from Infiltrator Thieves' Tools. These will be persistent across attempts, 
// and for all 'Autoroll' attempts.
//
// You can hover over the result rolled to see what the modifiers were.

export function skillChallenge(targetSuccesses, targetDC, actor, mod) {
    let successes = 0;
    let attempts = 0;
    let breakout = false;

    let results = "";
    let content = "";
    let rollResArr = []
    let resultString = "";
    let outcome;
    let rollRes;
    
    contentUpdate(0);
    runDialog();

    function arrayAdd(outcome) {
        let color;
        switch (outcome) {
            case 'critsuccess': successes++;
            case 'success': 
                successes++
                color = 'green'
                break;
            case 'fail': 
                color = 'black';
                break;
            case 'critfail': 
                color = 'red';
                break;
        }
        rollResArr.push(` 
        <div class="pf2e-rsc-tooltip">
            <span class="pf2e-rsc-scripts-number${outcome}">
                    <span class="pf2e-rsc-tooltiptext" style="border-color: ${color}">${resultString}
                    </span>
                    ${rollRes._total}</span>.
                </div>`)
        console.log(rollResArr)
    }

    async function resultsAdd(outcome) {
        let color;
        switch (outcome) {
            case 'critsuccess':
                color = 'green'
                results += `<div><span class="pf2e-rsc-scripts-wordcritsuccess">Critical Success!</span><br/>`
                successes = successes + 2
                break;
            case 'success':
                color = 'green'
                results += `<div><span class="pf2e-rsc-scripts-wordsuccess">Success!</span><br/>`
                successes++
                break;
            case 'fail':
                color = 'black'
                results += `<div><span class="pf2e-rsc-scripts-wordfail">Failure.</span><br/>`
                break;
            case 'critfail':
                color = 'red'
                results += `<div><span class="pf2e-rsc-scripts-wordcritfail">Critical Failure!</span><br/>`
                break;
        }
        results += ` Your result was
                <div class="pf2e-rsc-tooltip">
                    <span class="pf2e-rsc-scripts-number${outcome}">
                        <span class="pf2e-rsc-tooltiptext" style="border-color: ${color}">${resultString}
                        </span>
                        ${rollRes._total}</span>.
                </div>`
    }

    // if autopick is checked, keep going until success or critical failure
    async function fastMode(targetSuccesses, targetDC, actor, mod, bonuses) {
        do {
            attempts++
            rollRes = new Roll("1d20 + @mod + @bonuses", {mod, bonuses} ).roll()
            resultString = ""; // this will look like "13+4+0" etc
            for (let i=0; i<rollRes.results.length ; i++) {
                resultString += `${rollRes.results[i]}`
            }
            if (rollRes._total >= targetDC + 10) { // if the roll result is a critical success
                if (rollRes.results[0] === 1) { // but the d20 roll was a 1, reduce it to a success
                    outcome = 'success'
                } else {
                    outcome = 'critsuccess'
                }
            } else if (rollRes._total >= targetDC) { // if the roll result is a success
                if (rollRes.results[0] === 1) { // but the d20 roll was a 1, reduce it to a failure
                    outcome = 'fail'
                } else if (rollRes.results[0] === 20) { // but if the d20 roll was a 20, make it a critical success
                    outcome = 'critsuccess'
                } else {
                    outcome = 'success'
                }
            } else if (rollRes._total <= targetDC - 10) { // if the roll result is a critical failure
                if (rollRes.results[0] === 20) { // but the d20 roll was a 20, make it a regular failure
                    outcome = 'fail'
                    breakout = true;
                } else {
                    outcome = 'critfail'
                }
            } else { // if the roll result is a failure
                if (rollRes.results[0] === 1) { // but the d20 roll was a 1, reduce it to a critical failure
                    outcome = 'critfail'
                } else if (rollRes.results[0] === 20) { // but if the d20 roll was a 20, make it a success
                    outcome = 'success'
                } else {
                    outcome = 'fail'
                }
            }
            arrayAdd(outcome)
        }
        while (successes < targetSuccesses && !breakout)

        if (successes >= targetSuccesses) results += `<span class="pf2e-rsc-scripts-wordsuccess">Success!</span><br/> The challenge is successful!<br/>`
        else results += `<span class="pf2e-rsc-scripts-wordfail">Impossible!</span><br/> The challenge is impossible!<br/>`
        if (rollResArr.length > 1) {
            results += ` Your roll results were: ${rollResArr.toString()}.`
            results += ` The attempt took ${attempts} rounds in total.`
        }
        else {
            results += ` Your roll result was: ${rollResArr.toString()}.`
            results += ` The attempt took ${attempts} round.`
        }
        
        generateChat(actor, results)
    }

    // if autoroll is not checked, go one roll at a time
    async function normalMode(targetSuccesses, targetDC, actor, mod, bonuses) {
        attempts++
        rollRes = new Roll("1d20 + @mod + @bonuses", {mod, bonuses} ).roll()
        resultString = ``; // this will look like "13+4+0" etc
        for (let i=0; i<rollRes.results.length ; i++) {
            resultString += `${rollRes.results[i]}`
        }
        if (rollRes._total >= targetDC + 10) { // if the roll result is a critical success
            if (rollRes.results[0] === 1) { // but the d20 roll was a 1, reduce it to a success
                resultsAdd('success')
            } else {
                resultsAdd('critsuccess')
            }
        } else if (rollRes._total >= targetDC) { // if the roll result is a success
            if (rollRes.results[0] === 1) { // but the d20 roll was a 1, reduce it to a failure
                resultsAdd('fail')
            } else if (rollRes.results[0] === 20) { // but if the d20 roll was a 20, make it a critical success
                resultsAdd('critsuccess')
            } else {
                resultsAdd('success')
            }
        } else if (rollRes._total <= targetDC - 10) { // if the roll result is a critical failure
            if (rollRes.results[0] === 20) { // but the d20 roll was a 20, make it a regular failure
                resultsAdd('fail')
            } else {
                resultsAdd('critfail')
            }
        } else { // if the roll result is a failure
            if (rollRes.results[0] === 1) { // but the d20 roll was a 1, reduce it to a critical failure
                resultsAdd('critfail')
            } else if (rollRes.results[0] === 20) { // but if the d20 roll was a 20, make it a success
                resultsAdd('success')
            } else {
                resultsAdd('fail')
            }
        }
        
        if (successes < targetSuccesses && !breakout) {
            results += ` You have attempted this skill challenge for ${attempts} rounds.</div>`
            contentUpdate(bonuses);
            runDialog();
        } else {
            if (successes >= targetSuccesses) results += ` The skill check is successful!`
            results += ` Your attempt lasted ${attempts} rounds.</div>`
        }
        generateChat(actor, results)
        results = ``
    }

    // used to create the chat messages
    async function generateChat(actor, output) {
        let chatData = { 
            user: game.user._id, 
            speaker: {
                alias: actor.name
            },
            content: output, 
        }; 
        await ChatMessage.create(chatData, {}); 
    } 

    // need to regenerate the dialog each time to keep bonuses persistent
    function runDialog() {
        let d = new Dialog({
            title: "Skill Challenge",
            content,
            buttons: {
              select: {
                icon: "<i class='fas fa-dice-d20'></i>",
                label: "Roll",
                callback: (html) => {
                    let bonuses = parseInt(html.find("#bonuses")[0].value)
                    if (html.find("#fastmode")[0].checked) {
                        fastMode(targetSuccesses, targetDC, actor, mod, bonuses)
                    } else {
                        normalMode(targetSuccesses, targetDC, actor, mod, bonuses)
                    }   
                }
              },
              cancel: {
                icon: "<i class='fas fa-lock-times'></i>",  
                label: "Cancel",
                callback: () => {
                    if (attempts > 0) {
                        if (successes === 1) results += `Skill challenge interrupted after ${successes} success.`
                        else results = `Skill challenge interrupted after ${successes} successes.`
                        generateChat(actor, results)
                    }
                }
              }
            },
              
        })
        d.options.width = 250;
        d.position.width = 250;
        d.render(true);
    }
    
    // used to keep any entered bonuses peristent between re-renderings
    async function contentUpdate(bonuses) { 
        content = `<div id="pf2e-rsc-scripts-content">
        <label for="bonuses">Specific bonuses: </label>
        <input type="text" id="bonuses" name="bonuses" value="${bonuses}"></br>
        <label for="fastmode" style="display: inline-block; vertical-align: middle; position:relative">Autoroll?</label>
        <input type="checkbox" name="fastmode" id="fastmode" style="position: relative; vertical-align:middle">
        </br>
        </div>`
    }    
}