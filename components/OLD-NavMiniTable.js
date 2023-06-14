
const NavMiniTable = ({ elementSelected, elements }) => {
    const activeElement = (elementSelected.name + "-" + elementSelected.ypos + "-" + elementSelected.xpos)

    const elementsList = elements.map(element => {
        const elementCssClass = (element.name + "-" + element.ypos + "-" + element.xpos)
        let highlightActiveElement = ""

        if (activeElement === elementCssClass) {
            highlightActiveElement = "activeElement"
        } else {
            highlightActiveElement = ""
        }

        return (
            <div key={element.number} className={element.category + " " + elementCssClass + " " + highlightActiveElement}>

                <Link to={'/element/' + element.name} className="linkTableCard">
                    <div className="elementTableCard"></div>
                </Link>
            </div>

        )
    })
    return (
        <div className="periodicTable32cols navTable" >
            {elementsList}
        </div>
    )
}

export default NavMiniTable

