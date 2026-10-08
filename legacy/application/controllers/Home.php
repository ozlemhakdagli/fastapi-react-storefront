<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Home extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		$this->load->library("session");
		$this->load->database();
		$this->load->helper('url');
		$this->load->model("Database_Model");
		
	} 
	public function index()
	{
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		
		$query=$this->db->query("SELECT * FROM urunler  WHERE durum='yeni' limit 3");
		$data["slider"]=$query->result();
		$data["menu"]="anasayfa";
		$data["sayfa"]="Anasayfa";
		$query=$this->db->query("SELECT * FROM urunler  WHERE durum='yeni' ");
		$data["urunler"]=$query->result();
		
		$this->load->view('_header',$data);
		$this->load->view('slider');
		$this->load->view('_leftslide');
		$this->load->view('_main_content');
		$this->load->view('_footer');
		
		
	}
	public function login ()
	{
		$this->load->view('admin/login_formu');
	
	}
	public function uyepanel (){
		
	if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		
	$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$data["menu"]="uyepanel";
		$data["sayfa"]="Üye paneli";
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('uyepanel');
		$this->load->view('_footer');
		
	
	}
	public function siparislerim (){
		
	if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		$data["menu"]="uyepanel";
		$data["sayfa"]="Siparişlerim";
		$musteri_id= $this->session->uye_oturum["id"];
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		
		
		
		$query=$this->db->query("SELECT * FROM siparisler_uye WHERE musteri_id=$musteri_id");
		$data["siparisler"]=$query->result();
		
	
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('uye_siparisler',$data);
		$this->load->view('_footer');
		
	
	}
	public function urun_detay ($id)
	{
	    $data["menu"]="urunler";
	    $sorgu=$this->db->query("SELECT * FROM urunler WHERE ID= $id");
		$data["veri"]=$sorgu->result();
	    $query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
        $data["sayfa"]=" ";

		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		$sorgu=$this->db->query("SELECT * FROM yorumlar WHERE urun_id= $id");
		$data["yorumlar"]=$sorgu->result();
		$sorgu=$this->db->query("SELECT * FROM urunler WHERE ID= $id");
		$data["urun"]=$sorgu->result();
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$sorgu=$this->db->query("SELECT * FROM urunler_resim WHERE urunler_id= $id");
		$data["veriler"]=$sorgu->result();
		$data["kat"]=$this->Database_Model->urun_get($id);
		
		$this->load->view('_header',$data);
		$this->load->view('_leftslide');
		$this->load->view('urun_detay');
		$this->load->view('_footer');
		
	}
	public function sepete_ekle ($id)
	{
		$data=array(
			'musteri_id' => $this->session->uye_oturum["id"],
			'urun_id' => $id,
			'miktar' => $this->input->post('miktar')
			
			
			);
			$this->Database_Model->insert_data("sepet",$data);
			$this->session->set_flashdata('urun','Ürün Sepete Eklendi !');
			redirect (base_url()."home/urun_detay/".$id);
	}
	public function sepetsil ($id)
	{
		$this->db->query("DELETE FROM sepet WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."home/sepetim/");
	}
	public function sepetim (){
		
	if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		$data["menu"]="sepetim";
		$data["sayfa"]="Sepetim";
		$musteri_id= $this->session->uye_oturum["id"];
		$query=$this->db->query("SELECT * FROM musteriler WHERE Id=$musteri_id");
		$data["musteri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$query=$this->db->query("SELECT sepet.*, urunler.adi AS urunad, urunler.sfiyat AS urunfiyat 
		FROM sepet 
		INNER JOIN urunler ON urunler.Id=sepet.urun_Id
		WHERE sepet.musteri_id= $musteri_id");
		$data["veriler"]=$query->result();
	
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('uye_sepet',$data);
		$this->load->view('_footer');
		
	
	}
	public function siparis_tamamla (){
		
		$musteri_id=$this->session->uye_oturum["id"];
		
		//BANKA KREDİ KARTI ÖDEME TUTARI GÖNDERİLİP ONAY ALINMASI
		
		
	$data=array(
			'adsoy' => $this->input->post('adsoy'),
			'adres' => $this->input->post('adres'),
			'tel' => $this->input->post('tel'),
			
			'tutar' => $this->input->post('tutar'),
			'musteri_id' => $musteri_id,
			'Ip' =>	$_SERVER['REMOTE_ADDR']
			);
			$siparis_id = $this->Database_Model->insert_data("siparisler",$data);//hem oluşturuyoruz hemde ürünlerde 
			 $this->Database_Model->insert_data("siparisler_uye",$data);//
			if($siparis_id){
			$query=$this->db->query("SELECT sepet.*, urunler.adi AS urunad, urunler.sfiyat AS urunfiyat 
		FROM sepet 
		INNER JOIN urunler ON urunler.Id=sepet.urun_Id
		WHERE sepet.musteri_id= $musteri_id");
		$veriler =$query->result();
		foreach($veriler as $rs)
		{
			$data=array(
			'musteri_id' => $this->session->uye_oturum["id"],
			'siparis_id' => $siparis_id,
			'urun_id' => $rs->Id,
			'adi' => $rs->urunad,
			'miktar' => $rs->miktar,
			'fiyat' => $rs->urunfiyat,
			'tutar' => ($rs->miktar * $rs->urunfiyat)
						
			);
			$this->Database_Model->insert_data("siparis_urunler",$data);
			
		}
			} //Ürün_id if
			
			$query=$this->db->query("DELETE FROM sepet WHERE musteri_id=$musteri_id");                // sepeti boşaltmak
			$this->session->set_flashdata('mesaj','Siparişiniz Tamamlanmıştır.Teşekkür Ederiz !');
			redirect(base_url()."home/siparislerim");
			
			
	}
	public function siparis_detay ($id){
		$data["sayfa"]="Sipariş Detayı";
		if(! $this->session->userdata('uye_oturum'))
			{
				$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
				redirect(base_url().'MusteriLogin');
			}
		$data["menu"]="uyepanel";
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$musteri_id=$this->session->uye_oturum["id"];
		
		$query=$this->db->query("SELECT * FROM siparisler WHERE Id=$id");
		$data["siparis"]=$query->result();
		
		$query=$this->db->query("SELECT * FROM siparis_urunler WHERE siparis_id=$id");
		$data["urunler"]=$query->result();
		
		
	
		
		$this->load->view('uye_siparis_detay',$data);
		
		
		
	}
	public function hakkimizda ()
	{$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$data["menu"]="hakkimizda";
		$data["sayfa"]="Hakkımızda";
		$this->load->view('_header',$data);		
		$this->load->view('_leftslide');
		$this->load->view('hakkimizda');
		$this->load->view('_footer');
		
	
	}
	public function urunler ()
	{   
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$query=$this->db->query("SELECT * FROM urunler ");
		$data["urunler"]=$query->result();
		$data["menu"]="urunler";
		$data["sayfa"]="Ürünler";
		$this->load->view('_header',$data);		
		$this->load->view('_leftslide');
		$this->load->view('urunler');
		$this->load->view('_footer');
		
	
	}
	public function yorumekle ($id)
	{
		$urun_id = $id;
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		
		$data=array(
			'adsoy'=> $this->input->post('adsoy'),
			'email'=> $this->input->post('email'),
			'yorum'=> $this->input->post('yorum'),
			
			'urun_id'=>$urun_id 
			
			);
			$this->Database_Model->insert_data("yorumlar",$data);
			$this->session->set_flashdata("sonuc", "Yorumunuz başarı ile tarafımıza iletilmiştir.En kısa süre içinde geri dönüş yapılacaktır.");
	redirect(base_url()."home/urun_detay/".$id);
	}
	public function yorumlarim ()
	{
		$data["menu"]="uyepanel";
		$data["sayfa"]="Yorumlar";
		if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		
		$email= $this->session->uye_oturum["email"];
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		
		
		$query=$this->db->query("SELECT * FROM yorumlar WHERE email ='$email' ");
		$data["yorumlar"]=$query->result();
		
	
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('uye_yorumlar',$data);
		$this->load->view('_footer');
		
	
	}
	public function yorum_detay ($id)
	{
		
		if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		$data["menu"]="uyepanel";
		$data["sayfa"]="Yorum Detay";
		$email= $this->session->uye_oturum["email"];
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		
		$data["veriler"]=$this->Database_Model->urunadi_get($id);
		
		$query=$this->db->query("SELECT * FROM yorumlar WHERE email ='$email' ");
		$data["yorumlar"]=$query->result();
		
	
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('yorum_detay',$data);
		$this->load->view('_footer');
		
	
	}
	public function yorumsil($id)
	{		
		$this->db->query("DELETE FROM yorumlar WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."home/yorumlarim");
			
		
		
	}
	public function mesajlarim()
	{
		
		if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		$data["sayfa"]="Gönderilen Mesajlar";
		$email= $this->session->uye_oturum["email"];
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$data["menu"]="uyepanel";
		
		$query=$this->db->query("SELECT * FROM mesajlar_uye WHERE email ='$email' ");
		$data["mesajlar"]=$query->result();
		
	
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('uye_mesajlar',$data);
		$this->load->view('_footer');
		
	
	}
	public function g_mesajlarim()
	{
		
		if(! $this->session->userdata('uye_oturum')){
		$this->session->set_flashdata('mesaj','Giriş Yapmadınız');
		redirect(base_url().'MusteriLogin');}
		
		$email= $this->session->uye_oturum["email"];
		
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		$data["menu"]="uyepanel";
			$data["sayfa"]="Gelen Mesajlar";
		$query=$this->db->query("SELECT * FROM g_mesajlar_uye WHERE email ='$email' ");
		$data["mesajlar"]=$query->result();
		
	
		$this->load->view('_header',$data);
		$this->load->view('uyeleft_side');
		$this->load->view('uye_g_mesajlar',$data);
		$this->load->view('_footer');
		
	
	}
		public function g_mesajsil($id)
	{		
		$this->db->query("DELETE FROM g_mesajlar_uye WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."home/g_mesajlarim");
			
		
		
	}
		public function mesajsil($id)
	{		
		$this->db->query("DELETE FROM mesajlar_uye WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."home/mesajlarim");
			
		
		
	}
	public function kategori ($id)
	
	{
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$result= $data["kat"]=$this->Database_Model->get_kategori($id);
		$data["veriler"]=$result;
		$sorgu=$this->db->query("SELECT * FROM yorumlar WHERE urun_id= $id");
		$data["yorumlar"]=$sorgu->result();
		$data["menu"]="urunler";
		$data["sayfa"]="Ürünler";
		$sorgu=$this->db->query("SELECT * FROM urunler WHERE ID= $id");
		$data["urun"]=$sorgu->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		
		$this->load->view('_header',$data);
		$this->load->view('_leftslide');
		$this->load->view('kategori');
		$this->load->view('_footer');
	
		
	}
	public function marka ($id)
	
	{
		$query=$this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$result= $data["kat"]=$this->Database_Model->get_marka($id);
		$data["veriler"]=$result;
		$sorgu=$this->db->query("SELECT * FROM yorumlar WHERE urun_id= $id");
		$data["yorumlar"]=$sorgu->result();
		$data["menu"]="urunler";
		$sorgu=$this->db->query("SELECT * FROM urunler WHERE ID= $id");
		$data["urun"]=$sorgu->result();
		$data["sayfa"]="Ürünler";
		$query=$this->db->get("turu");
		$data["turu"]=$query->result();
		$query=$this->db->get("kategoriler");
		$data["kategoriler"]=$query->result();
		$query=$this->db->get("ayarlar");
		$data["Veri"]=$query->result();
		
		$this->load->view('_header',$data);
		$this->load->view('_leftslide');
		$this->load->view('marka');
		$this->load->view('_footer');
	
		
	}
	public function siparissil($id)
	{		
		$this->db->query("DELETE FROM siparisler_uye WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."home/siparislerim");
			
		
		
	}
	
	
}
		
	
	

