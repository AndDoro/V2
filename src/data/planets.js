/* Орбітальні півосі в а.о. і періоди обертання — орієнтовні.
   3D-сцена використовує інший, умовний масштаб. */
export const PLANETS = [
  {id:'mercury',name:'Меркурій',en:'Mercury',au:0.387,period:0.241,diameter:4879,visualDistance:4.2,visualRadius:.22, color:'#9b9a93',type:'rock',orbitTilt:0.04,description:'Найближча до Сонця планета. Майже не має атмосфери; поверхня вкрита кратерами.'},
  {id:'venus',name:'Венера',en:'Venus',au:0.723,period:0.615,diameter:12104,visualDistance:6.3,visualRadius:.38,color:'#dbbd8c',type:'venus',orbitTilt:0.026,description:'Планета з густою атмосферою та дуже високою температурою поверхні.'},
  {id:'earth',name:'Земля',en:'Earth',au:1,period:1,diameter:12742,visualDistance:8.65,visualRadius:.42,color:'#3b83c2',type:'earth',orbitTilt:0,description:'Наш дім — планета з рідкою водою на поверхні та різноманітним життям.'},
  {id:'mars',name:'Марс',en:'Mars',au:1.524,period:1.881,diameter:6779,visualDistance:11.4,visualRadius:.32,color:'#bb6345',type:'mars',orbitTilt:.033,description:'Кам’яниста планета з червонуватою поверхнею, полярними шапками та тонкою атмосферою.'},
  {id:'jupiter',name:'Юпітер',en:'Jupiter',au:5.203,period:11.86,diameter:139820,visualDistance:16.4,visualRadius:1.22,color:'#d7af84',type:'jupiter',orbitTilt:.022,description:'Найбільша планета Сонячної системи. Газовий гігант із виразними хмарними смугами.'},
  {id:'saturn',name:'Сатурн',en:'Saturn',au:9.537,period:29.46,diameter:116460,visualDistance:22.0,visualRadius:1.04,color:'#e0cc9f',type:'saturn',orbitTilt:.044,description:'Газовий гігант із системою кілець, які складаються переважно з крижаних частинок.'},
  {id:'uranus',name:'Уран',en:'Uranus',au:19.19,period:84.02,diameter:50724,visualDistance:27.4,visualRadius:.75,color:'#9ce8e8',type:'uranus',orbitTilt:.013,description:'Крижаний гігант із вираженим нахилом осі обертання.'},
  {id:'neptune',name:'Нептун',en:'Neptune',au:30.07,period:164.8,diameter:49244,visualDistance:33.0,visualRadius:.73,color:'#4567d3',type:'neptune',orbitTilt:.031,description:'Далекий крижаний гігант із блакитним кольором атмосфери.'}
];
export const PLANET_BY_ID = Object.fromEntries(PLANETS.map(p=>[p.id,p]));
