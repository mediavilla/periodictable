import React from 'react';
import Link from 'next/link'
import navTopStyles from '../styles/navTop.module.css';

export default function NavTop() {

    return (
        <nav className="">
            <ul className="">
                <li><Link href="#">Topologies</Link></li>
                <li><Link href="#">Timeline</Link></li>
                <li><Link href="#">Elements</Link></li>
                <li><Link href="#">Particles</Link></li>
                <li><Link href="#">Scientists</Link></li>
            </ul>
        </nav >
    );
}
