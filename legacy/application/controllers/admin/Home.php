<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Home extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		$this->load->library("session");
		$this->load->helper(array('form','url'));
		$this->load->database();
		$this->load->model('Admin_Model');
		$this->load->model('Database_Model');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
	} 
	public function index()
	{
        $data['sayfa']='Tecnopart Admin Paneli' ;
	    $query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Yeni'" );
	    $data['veriler']=$query->result();
	    $query = $this->db->query("SELECT * FROM urunler  WHERE durum='Yeni'" );
	    $data['urunler']=$query->result();
	    $query = $this->db->query("SELECT * FROM mesajlar  WHERE durum='Yeni'" );
	    $data['mesajlar']=$query->result();
	     $query = $this->db->query("SELECT * FROM siparisler  WHERE durum='Tamamlandı'" );
	    $data['veri']=$query->result();
	     $query = $this->db->query("SELECT * FROM musteriler " );
	    $data['musteriler']=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/main_content',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function hakkimizda()
	{
		$query = $this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$data['sayfa']='Hakkımızda' ;
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/hakkimizda_ekle',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function hakkimizda_guncelle($id)
	{
		$data=array(
				'hakkimizda'=> $this->input->post('hakkimizda')
				);
				$this->Admin_Model->update_data("ayarlar",$data,$id);
				redirect(base_url()."admin/home");
		
		
	}
	public function iletisim()
	{
		$query = $this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$data['sayfa']='İletişim' ;
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/iletisim_ekle',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function iletisim_guncelle($id)
	{
		$data=array(
				'email'=> $this->input->post('email'),
				'adres'=> $this->input->post('adres'),
				'tel'=> $this->input->post('tel'),
				'sehir'=> $this->input->post('sehir'),
				'fax'=> $this->input->post('fax'),
				'iletisim'=> $this->input->post('iletisim')
																
				);
				$this->Admin_Model->update_data("ayarlar",$data,$id);
				redirect(base_url()."admin/home");
		
		
	}
	public function bilgiler()
	{
		$query = $this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$data['sayfa']='Bilgiler' ;
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/bilgiler_ekle',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function bilgileri_guncelle($id)
	{
		$data=array(
				'adi'=> $this->input->post('adi'),
				'keywords'=> $this->input->post('keywords'),
				'aciklama'=> $this->input->post('aciklama'),
				'smtpserver'=> $this->input->post('smtpserver'),
				'smtpport'=> $this->input->post('smtpport'),
				'smtpemail'=> $this->input->post('smtpemail'),
				'smtpsifre'=> $this->input->post('smtpsifre'),
				'adres'=> $this->input->post('adres'),
				'tel'=> $this->input->post('tel'),
				'sehir'=> $this->input->post('sehir'),
				'fax'=> $this->input->post('fax'),
				'email'=> $this->input->post('email'),
				'facebook'=> $this->input->post('facebook'),
				'instagram'=> $this->input->post('instagram'),
				'pinterest'=> $this->input->post('pinterest')
																
				);
				$this->Admin_Model->update_data("ayarlar",$data,$id);
				redirect(base_url()."admin/home");
		
		
	}
		
	public function login ()
	{
	    
	    
		$this->load->view('admin/login_formu');
	
	}
		
	public function yorumlar()
	
	{ 	$query = $this->db->get("ayarlar");
		$data["veri"]=$query->result();
		$query=$this->db->get("yorumlar");
		$data["yorum"]=$query->result();
		$data['sayfa']='Yorumlar' ;
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/yorumlar_listesi',$data);		
		$this->load->view('admin/footer');
	}
	public function yorumsil($id)
	{		
		$this->db->query("DELETE FROM yorumlar WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/home/yorumlar");
			
		
		
	}
		public function kategoridelete($id)
	{		
		$this->db->query("DELETE FROM kategoriler WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/urunler/kategoriler");
			
		
		
	}
	public function kategoriedit($id)
	{	$data['sayfa']='Kategori Düzenle' ;
		$query=$this->db->query("select * from turu order by adi");
		$data['turler']=$query->result();
		$query=$this->db->query("select * from kategoriler order by adi");
		$data['kategoriler']=$query->result();
		$sorgu=$this->db->query("SELECT * FROM kategoriler WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/kategori_duzenle',$data);
		$this->load->view('admin/footer');
			
		
		
	}
	public function guncellekaydet($id)
	{		
		$data=array(
			'adi'   => $this->input->post('adi'),
			'aciklama' => $this->input->post('aciklama'),
			'keywords' => $this->input->post('keywords')
			
		
			);
			$this->Database_Model->update_data("kategoriler",$data,$id);
			$this->session->set_flashdata('sonuc','Güncelle işlemi başarılıdır!');
			redirect (base_url()."admin/urunler/kategoriler");
			
		
		
	}
		public function markadelete($id)
	{		
		$this->db->query("DELETE FROM turu WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/urunler/markalar");
			
		
		
	}
	public function markaedit($id)
	{	$data['sayfa']='Marka Düzenle' ;	
		$query=$this->db->query("select * from turu order by adi");
		$data['turler']=$query->result();
		$query=$this->db->query("select * from kategoriler order by adi");
		$data['kategoriler']=$query->result();
		$sorgu=$this->db->query("SELECT * FROM turu WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/marka_duzenle',$data);
		$this->load->view('admin/footer');
			
		
		
	}
	public function guncellekaydetmarka($id)
	{		
		$data=array(
			'adi'   => $this->input->post('adi'),
			'aciklama' => $this->input->post('aciklama'),
			'keywords' => $this->input->post('keywords')
			
		
			);
			$this->Database_Model->update_data("turu",$data,$id);
			$this->session->set_flashdata('sonuc','Güncelle işlemi başarılıdır!');
			redirect (base_url()."admin/urunler/markalar");
			
		
		
	}
}
