import NavTop from '../components/NavTop';
import Footer from '../components/Footer'

export default function elements() {

    return (
        <>
            <main>

                <div id="content">

                    <NavTop />

                    <p>This need to be a bento box page that changes dynamically depending on the date and search takes prominence so that users can search for elements to jump to their page</p>
                    <p>There are 118 elements in the periodic table, these are the elements that make up everything in the universe, our planet, us</p>
                    <p>Would be cool to get a few ways to filter elements in different ways:</p>
                    <ul>
                        <li>Elements present in the human body</li>
                        <li>Elements present in nature / Earth</li>
                        <li>Elements present in the universe</li>
                        <ul>
                            <li>The Moon</li>
                            <li>Mars</li>
                            <li>Other planets in the solar system</li>
                        </ul>
                        <li>What elements are the most easy to combine with others</li>
                        <li>What elements are lighter / heavier</li>
                        <li>Groupings of the elements</li>
                    </ul>
                </div>
            </main>
            <Footer />

        </>

    );
}
