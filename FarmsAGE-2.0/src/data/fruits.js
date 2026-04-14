const fruits = [
  {
    id: 1,
    name: "Apple",
    price: 140,
    oldPrice: 180,
    discount: "22% OFF",
    image:
      "https://media.istockphoto.com/id/1824526058/photo/apple-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=CtJOeFAUpoNI1kJ-cNDHmLaZaiWYvmLaec3HsH94FkQ=",
  },
  {
    id: 2,
    name: "Banana",
    price: 50,
    oldPrice: 65,
    discount: "23% OFF",
    image:
      "https://media.istockphoto.com/id/2258763200/photo/banana-bunch-1.jpg?s=612x612&w=0&k=20&c=xmHBV-5xhyasGOhBjq5Y_oXK8yzdOQyLwy1rUdenYGs=",
  },
  {
    id: 3,
    name: "Orange",
    price: 80,
    oldPrice: 100,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/1237546553/photo/orange-slice-into-pieces-with-drop-shadow-on-white-background-commercial-image-of-citrus.jpg?s=612x612&w=0&k=20&c=9ha87Lr6wYSEkimCVQF-8eXq0MQ0SgsqEljhfK2y4nU=",
  },
  {
    id: 4,
    name: "Mango",
    price: 120,
    oldPrice: 150,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/1315824943/photo/handles.jpg?s=612x612&w=0&k=20&c=7Mm6zmqNSRcJRijMuSlGhcgYmjXghqhQ4kPaDtN-ehI=",
  },
  {
    id: 5,
    name: "Pineapple",
    price: 90,
    oldPrice: 120,
    discount: "25% OFF",
    image:
      "https://media.istockphoto.com/id/146055059/photo/pineapple-isolated.jpg?s=612x612&w=0&k=20&c=l3pL1b_vErlC0foL2JCGwRr_FeOYi-uh42mccmeThPM=",
  },
  {
    id: 6,
    name: "Strawberry",
    price: 160,
    oldPrice: 200,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/978985258/photo/fresh-red-strawberries.jpg?s=612x612&w=0&k=20&c=9zfe7I4na4joOuCmWe71FMC0tk0nFV1xFIGErZmbhHA=",
  },
  {
    id: 7,
    name: "Watermelon",
    price: 70,
    oldPrice: 90,
    discount: "22% OFF",
    image:
      "https://media.istockphoto.com/id/1209448320/photo/watermelon-isolated-on-white-clipping-path.jpg?s=612x612&w=0&k=20&c=bJM9NrAvcpPhWqKqLJ1z8BE7nFp3uq0cgxM95F2Zhb4=",
  },
  {
    id: 8,
    name: "Papaya",
    price: 60,
    oldPrice: 80,
    discount: "25% OFF",
    image:
      "https://media.istockphoto.com/id/1615429523/photo/ripe-papaya-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=YrbDfirPpY-j3a3Z94Eft3iEnbgFAZ7sUb6tGMWncxw=",
  },
  {
    id: 9,
    name: "Guava",
    price: 55,
    oldPrice: 75,
    discount: "27% OFF",
    image:
      "https://media.istockphoto.com/id/1297971388/photo/guava-fruit-with-leaves-isolated.jpg?s=612x612&w=0&k=20&c=mU5kb7O8UQMc2h9SNfag5eyZhMlbfa62nKGbM7jcVUs=",
  },
  {
    id: 10,
    name: "Pomegranate",
    price: 150,
    oldPrice: 190,
    discount: "21% OFF",
    image:
      "https://media.istockphoto.com/id/2243782247/photo/pomegranate-fruit-with-half-of-pomegranate-and-leaves-isolated-on-a-white-background-clipping.jpg?s=612x612&w=0&k=20&c=lKOZ6SYP0nsjrvHjpwetESH17C4ts9kDDIlvpUpuKcM=",
  },
  {
    id: 11,
    name: "Kiwi",
    price: 180,
    oldPrice: 220,
    discount: "18% OFF",
    image:
      "https://media.istockphoto.com/id/176767255/photo/iwi-fruits-isolated-on-white-background-macro-photo.jpg?s=612x612&w=0&k=20&c=Q1Za_Q2c0zPRBZsNuiIYc3u4MFOvXO27QvBYbZ-XQvo=",
  },
  {
    id: 12,
    name: "Blueberry",
    price: 250,
    oldPrice: 300,
    discount: "16% OFF",
    image:
      "https://media.istockphoto.com/id/901169008/photo/ripe-berry-blueberries-in-a-straw-plate-on-a-white-background.jpg?s=612x612&w=0&k=20&c=2MefQxwutHapkKsLGpkp1xIbueVLL390R68ZWyJulGQ=",
  },
  {
    id: 13,
    name: "Cherry",
    price: 320,
    oldPrice: 400,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/508631605/photo/cherries.jpg?s=612x612&w=0&k=20&c=F7whCEXSDO5c7sa4wEendgoLtynSBbrMmCv2Jm-xYr4=",
  },
  {
    id: 14,
    name: "Grapes",
    price: 110,
    oldPrice: 140,
    discount: "21% OFF",
    image:
      "https://media.istockphoto.com/id/120917343/photo/tasty-grape.jpg?s=612x612&w=0&k=20&c=ONbZJpb2fCUTDV7B7qiKjRMBF5EBiWkI1utZMuT5Si0=",
  },
  {
    id: 15,
    name: "Pear",
    price: 130,
    oldPrice: 160,
    discount: "18% OFF",
    image:
      "https://media.istockphoto.com/id/503176183/photo/pears-isolated.jpg?s=612x612&w=0&k=20&c=XqIoItAtTKKguM7Sg9T_SkfeLbKEOzIf4wIULXRxucI=",
  },
  {
    id: 16,
    name: "Peach",
    price: 160,
    oldPrice: 200,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/2163390594/photo/ripe-peaches-with-leaf-and-slice-of-peach-on-white-background-file-contains-clipping-path.jpg?s=612x612&w=0&k=20&c=-PbuCS3E5NBhdf-ouE2NjplzYWA85XnoOkwxzHkIayo=",
  },
  {
    id: 17,
    name: "Plum",
    price: 140,
    oldPrice: 180,
    discount: "22% OFF",
    image:
      "https://media.istockphoto.com/id/2231116229/photo/ripe-chinese-plums-with-green-leaf-and-plum-slice-isolated-on-white-background-file-contains.jpg?s=612x612&w=0&k=20&c=gV6ADqWHnnUDUOQ9EYNH--lBmvkCdV5DnW_SJTi5YXI=",
  },
  {
    id: 18,
    name: "Dragon Fruit",
    price: 200,
    oldPrice: 250,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/887706658/photo/pitahaya-isolated.jpg?s=612x612&w=0&k=20&c=DQD4UJBhiQUFiuwtFVPS1iXV9wMjdhbYVwPZSJE1fuU=",
  },
  {
    id: 19,
    name: "Coconut",
    price: 40,
    oldPrice: 50,
    discount: "20% OFF",
    image:
      "https://media.istockphoto.com/id/953704340/photo/green-coconut-fruit-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=Swxqn4YDcJ6FhDrfAcl2yO4vVfAqQcrf1-5RRjcUCGQ=",
  },
  {
    id: 20,
    name: "Avocado",
    price: 250,
    oldPrice: 320,
    discount: "21% OFF",
    image:
      "https://media.istockphoto.com/id/2148795650/photo/avocado-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=_P_Pld9jkDoSQtEFSpLLKqe0vYc4tWkGcB0dkrVvLQc=",
  },
];

export default fruits;

